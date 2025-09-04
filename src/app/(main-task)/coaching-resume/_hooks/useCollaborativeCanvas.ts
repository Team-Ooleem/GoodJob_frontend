'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '../_stores';
import * as Y from 'yjs';
import io from 'socket.io-client';
import * as fabric from 'fabric';

// fabric v6 기준
type FabricObject = fabric.Object & { id?: string; __fromRemote?: boolean };

// 가벼운 고유ID
const makeId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// 서버 payload → Uint8Array
const toU8 = (payload: unknown): Uint8Array => {
    if (payload instanceof Uint8Array) return payload;
    if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
    if (Array.isArray(payload)) return Uint8Array.from(payload as number[]);
    if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
        const p = (payload as any).data;
        if (p instanceof ArrayBuffer) return new Uint8Array(p);
        if (Array.isArray(p)) return Uint8Array.from(p as number[]);
    }
    throw new Error('Unknown binary format from server');
};

// v6: enlivenObjects는 Promise 반환 (콜백 X)
const enlivenObjects = (arr: any[]): Promise<fabric.Object[]> =>
    (fabric.util.enlivenObjects as unknown as (a: any[]) => Promise<fabric.Object[]>)(arr);

export function useCollaborativeCanvas(room: string) {
    const canvas = useCanvasStore((s) => s.canvasInstance);

    useEffect(() => {
        if (!canvas) return;

        // --- 상태 플래그 ---
        let isApplyingRemote = false;
        let suppressNextAddedId: string | null = null;

        // --- Socket.IO ---
        const socket = io('http://localhost:4000', {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
            // 연결된 후에 join (연결 전에 emit하면 드물게 누락될 수 있음)
            socket.emit('join', room);
            // console.log('[socket] connected', socket.id);
        });
        socket.on('connect_error', (e) => console.error('[socket] connect_error', e));
        socket.on('error', (e) => console.error('[socket] error', e));

        // --- Y.Doc ---
        const ydoc = new Y.Doc();
        const yObjects = ydoc.getMap<any>('objects'); // id -> fabric JSON

        // 로컬 Y 업데이트 → 서버로 브로드캐스트
        const onLocalYUpdate = (u8: Uint8Array) => {
            if (isApplyingRemote) return; // 원격 적용 중에는 송신 금지
            socket.emit('sync', { room, update: Array.from(u8) });
        };
        ydoc.on('update', onLocalYUpdate);

        // 원격 업데이트 적용 래퍼
        const applyRemote = (u8: Uint8Array) => {
            isApplyingRemote = true;
            try {
                Y.applyUpdate(ydoc, u8);
                void reconcileFromY();
            } finally {
                isApplyingRemote = false;
            }
        };

        // 초기/증분
        socket.on('init', (payload: unknown) => applyRemote(toU8(payload)));
        socket.on('update', (payload: unknown) => applyRemote(toU8(payload)));

        // --- 유틸 ---
        const getAll = () =>
            canvas.getObjects().filter((o) => !(o as any).excludeFromExport) as FabricObject[];

        const toSerializable = (obj: FabricObject) => {
            // id가 JSON에 포함되도록 최소한 'id'만 지정
            // 나머지는 fabric v6의 기본 toObject가 충분히 포함합니다.
            return obj.toObject(['id']);
        };

        const enlivenAndAdd = async (json: any): Promise<FabricObject> => {
            const [obj] = (await enlivenObjects([json])) as FabricObject[];
            obj.__fromRemote = true;
            canvas.add(obj);
            obj.__fromRemote = false;
            return obj;
        };

        // --- Y → Fabric 동기화 ---
        const reconcileFromY = async () => {
            const yIds = Array.from(yObjects.keys());
            const current = getAll();

            // 로컬 객체에 id 없으면 부여
            for (const o of current) if (!o.id) o.id = makeId();

            // 생성/업데이트
            for (const id of yIds) {
                const json = yObjects.get(id);
                if (!json) continue;

                const existing = current.find((o) => o.id === id);
                if (!existing) {
                    const obj = await enlivenAndAdd(json);
                    obj.id = id;
                } else {
                    // 교체(간단 전략). 필요 시 속성별 머지로 바꿔도 됨.
                    existing.__fromRemote = true;
                    canvas.remove(existing);
                    const newObj = await enlivenAndAdd(json);
                    newObj.id = id;
                    existing.__fromRemote = false;
                }
            }

            // Y에 없는 로컬 객체 제거
            for (const obj of getAll()) {
                if (!obj.id) continue;
                if (!yObjects.has(obj.id)) {
                    obj.__fromRemote = true;
                    canvas.remove(obj);
                    obj.__fromRemote = false;
                }
            }

            canvas.requestRenderAll();
        };

        // --- Fabric → Y 반영 ---
        const upsertToY = (obj: FabricObject) => {
            if (obj.__fromRemote) return;
            if (!obj.id) obj.id = makeId();
            const json = toSerializable(obj);
            Y.transact(ydoc, () => {
                yObjects.set(obj.id!, json);
            });
        };

        const removeFromY = (obj: FabricObject) => {
            if (obj.__fromRemote) return;
            if (!obj.id) return;
            Y.transact(ydoc, () => {
                yObjects.delete(obj.id!);
            });
        };

        // --- 이벤트 바인딩 ---
        const onAdded = (e: any) => {
            const obj = e.target as FabricObject;
            if (!obj) return;

            obj.set({
                hasControls: false, // 컨트롤 핸들 안 보임
                lockScalingX: true, // X축 스케일 잠금
                lockScalingY: true, // Y축 스케일 잠금
                lockRotation: true, // 회전 잠금
                lockSkewingX: true, // 기울이기 X 잠금
                lockSkewingY: true, // 기울이기 Y 잠금
                lockMovementX: false, // X축 이동 허용
                lockMovementY: false, // Y축 이동 허용
            });

            // free drawing 직후 object:added가 한 번 더 들어오는 걸 스킵
            if (suppressNextAddedId && obj.id === suppressNextAddedId) {
                suppressNextAddedId = null;
                return;
            }
            upsertToY(obj);
        };

        const onModified = (() => {
            let t: any;
            return (e: any) => {
                const obj = e.target as FabricObject;
                if (!obj) return;
                clearTimeout(t);
                t = setTimeout(() => upsertToY(obj), 60); // 과도한 송신 방지
            };
        })();

        const onRemoved = (e: any) => {
            const obj = e.target as FabricObject;
            if (obj) removeFromY(obj);
        };

        const onPathCreated = (e: any) => {
            const obj = e.path as FabricObject;
            if (!obj) return;
            if (!obj.id) obj.id = makeId();
            // 방금 그 path에 이어지는 object:added 한 번은 무시
            suppressNextAddedId = obj.id;
            upsertToY(obj);
        };

        canvas.on('object:added', onAdded);
        canvas.on('object:modified', onModified);
        canvas.on('object:removed', onRemoved);
        canvas.on('path:created', onPathCreated);

        return () => {
            canvas.off('object:added', onAdded);
            canvas.off('object:modified', onModified);
            canvas.off('object:removed', onRemoved);
            canvas.off('path:created', onPathCreated);

            ydoc.off('update', onLocalYUpdate);
            socket.disconnect();
            ydoc.destroy();
        };
    }, [canvas, room]);
}
