'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../_stores';
import * as Y from 'yjs';
import io from 'socket.io-client';
import * as fabric from 'fabric';
import { BACKEND_ORIGIN } from '@/constants/config';

type FabricObject = fabric.Object & {
    id?: string;
    __fromRemote?: boolean;
    __lastModified?: number;
};

const makeId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

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

const enlivenObjects = (arr: any[]): Promise<fabric.Object[]> =>
    (fabric.util.enlivenObjects as unknown as (a: any[]) => Promise<fabric.Object[]>)(arr);

const ensureId = (obj: FabricObject) => {
    if (!obj.id) obj.id = makeId();
    return obj.id;
};

// 객체 비교를 위한 해시 함수
const getObjectHash = (obj: FabricObject): string => {
    return `${obj.left || 0}_${obj.top || 0}_${obj.angle || 0}_${obj.scaleX || 1}_${obj.scaleY || 1}`;
};

export function useCollaborativeCanvas(room: string) {
    const canvas = useCanvasStore((s) => s.canvasInstance);
    const syncTimeoutRef = useRef<NodeJS.Timeout>();
    const lastSyncHashRef = useRef<Map<string, string>>(new Map());
    const isApplyingRemoteRef = useRef(false);

    useEffect(() => {
        if (!canvas) return;

        // --- Socket 연결 ---
        const socket = io(BACKEND_ORIGIN, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('Socket connected, joining room:', room);
            socket.emit('join', room);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        // --- Y.Doc 설정 ---
        const ydoc = new Y.Doc();
        const yObjects = ydoc.getMap<any>('objects');

        const onLocalYUpdate = (u8: Uint8Array, origin: any) => {
            // 원격에서 온 업데이트는 다시 전송하지 않음
            if (isApplyingRemoteRef.current || origin === 'remote') return;

            socket.emit('sync', { room, update: Array.from(u8) });
        };

        ydoc.on('update', onLocalYUpdate);

        const applyRemoteUpdate = async (u8: Uint8Array) => {
            isApplyingRemoteRef.current = true;
            try {
                Y.applyUpdate(ydoc, u8, 'remote');
                await syncFromY();
            } finally {
                setTimeout(() => {
                    isApplyingRemoteRef.current = false;
                }, 50); // 약간의 딜레이로 중복 업데이트 방지
            }
        };

        socket.on('init', (payload: unknown) => {
            console.log('Received initial state');
            applyRemoteUpdate(toU8(payload));
        });

        socket.on('update', (payload: unknown) => {
            console.log('Received update');
            applyRemoteUpdate(toU8(payload));
        });

        // Y.js → Canvas 동기화 (개선된 버전)
        const syncFromY = async () => {
            if (isApplyingRemoteRef.current === false) return;

            const canvasObjects = new Map<string, FabricObject>();
            canvas.getObjects().forEach((obj) => {
                const fo = obj as FabricObject;
                if (fo.id) canvasObjects.set(fo.id, fo);
            });

            const updatedObjects: FabricObject[] = [];

            // Y.js의 모든 객체 처리
            for (const [id, data] of yObjects.entries()) {
                if (data.type instanceof fabric.ActiveSelection) continue;

                const existing = canvasObjects.get(id);
                const newHash = `${data.left || 0}_${data.top || 0}_${data.angle || 0}_${data.scaleX || 1}_${data.scaleY || 1}`;
                const lastHash = lastSyncHashRef.current.get(id);

                if (existing) {
                    // 변경사항이 있는 경우에만 업데이트
                    if (lastHash !== newHash) {
                        existing.__fromRemote = true;
                        existing.__lastModified = Date.now();

                        existing.set({
                            left: data.left,
                            top: data.top,
                            angle: data.angle || 0,
                            scaleX: data.scaleX || 1,
                            scaleY: data.scaleY || 1,
                        });
                        existing.setCoords();
                        updatedObjects.push(existing);
                        lastSyncHashRef.current.set(id, newHash);
                    }
                    canvasObjects.delete(id);
                } else {
                    // 새 객체 추가
                    try {
                        const [obj] = (await enlivenObjects([data])) as FabricObject[];
                        obj.id = id;
                        obj.__fromRemote = true;
                        obj.__lastModified = Date.now();

                        // 객체 제어 설정
                        obj.set({
                            hasControls: false,
                            lockScalingX: true,
                            lockScalingY: true,
                            lockRotation: true,
                            lockSkewingX: true,
                            lockSkewingY: true,
                        });

                        canvas.add(obj);
                        lastSyncHashRef.current.set(id, newHash);
                        updatedObjects.push(obj);
                    } catch (error) {
                        console.error('Failed to enliven object:', error, data);
                    }
                }
            }

            // Y.js에 없는 객체 제거
            canvasObjects.forEach((obj) => {
                obj.__fromRemote = true;
                canvas.remove(obj);
                if (obj.id) {
                    lastSyncHashRef.current.delete(obj.id);
                }
            });

            // __fromRemote 플래그 리셋 (객체별로 개별 처리)
            updatedObjects.forEach((obj) => {
                setTimeout(() => {
                    obj.__fromRemote = false;
                }, 100);
            });

            // 렌더링 요청
            canvas.requestRenderAll();
        };

        // Canvas → Y.js 동기화 (디바운스 적용)
        const syncToY = () => {
            if (isApplyingRemoteRef.current) return;

            // 기존 타이머 클리어
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }

            // 디바운스 적용 (50ms 후 실행)
            syncTimeoutRef.current = setTimeout(() => {
                Y.transact(ydoc, () => {
                    const currentIds = new Set<string>();

                    canvas.getObjects().forEach((obj) => {
                        // ActiveSelection은 무시
                        if (obj instanceof fabric.ActiveSelection) return;

                        const fo = obj as FabricObject;

                        // 원격에서 온 객체가 아직 업데이트 중인 경우 스킵
                        if (
                            fo.__fromRemote &&
                            fo.__lastModified &&
                            Date.now() - fo.__lastModified < 200
                        ) {
                            return;
                        }

                        const id = ensureId(fo);
                        currentIds.add(id);

                        const data = fo.toObject();
                        data.id = id;

                        // 현재 해시와 비교하여 변경된 경우에만 업데이트
                        const currentHash = getObjectHash(fo);
                        const lastHash = lastSyncHashRef.current.get(id);

                        if (lastHash !== currentHash) {
                            yObjects.set(id, data);
                            lastSyncHashRef.current.set(id, currentHash);
                        }
                    });

                    // Y.js에만 있고 캔버스에 없는 객체 제거
                    Array.from(yObjects.keys()).forEach((id) => {
                        if (!currentIds.has(id)) {
                            yObjects.delete(id);
                            lastSyncHashRef.current.delete(id);
                        }
                    });
                });
            }, 50);
        };

        // 이벤트 핸들러들
        const onObjectAdded = (e: any) => {
            const obj = e.target as FabricObject;
            if (obj.__fromRemote) return;

            console.log('Object added:', obj.type);
            ensureId(obj);

            obj.set({
                hasControls: false,
                lockScalingX: true,
                lockScalingY: true,
                lockRotation: true,
                lockSkewingX: true,
                lockSkewingY: true,
            });

            syncToY();
        };

        const onObjectModified = (e: any) => {
            const target = e.target as FabricObject | undefined;
            if (!target || target.__fromRemote) return;

            console.log('Object modified:', target.type);

            if (target instanceof fabric.ActiveSelection) {
                const sel = target as fabric.ActiveSelection;

                // Selection 안의 개별 객체들 처리
                sel.getObjects().forEach((child) => {
                    ensureId(child as FabricObject);
                    (child as FabricObject).__fromRemote = false;
                });

                // Selection 해제
                sel.forEachObject((child) => canvas.add(child));
                canvas.remove(sel);
            }

            syncToY();
            canvas.requestRenderAll();
        };

        const onObjectRemoved = (e: any) => {
            const obj = e.target as FabricObject;
            if (obj.__fromRemote) return;

            console.log('Object removed:', obj.type);
            if (obj.id) {
                lastSyncHashRef.current.delete(obj.id);
            }
            syncToY();
        };

        const onPathCreated = () => {
            console.log('Path created');
            syncToY();
        };

        // 마우스 이벤트로 실시간 동기화
        const onObjectMoving = (e: any) => {
            const obj = e.target as FabricObject;
            if (obj.__fromRemote) return;

            // 이동 중에는 더 빠른 동기화
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
            syncTimeoutRef.current = setTimeout(syncToY, 16); // ~60fps
        };

        // 이벤트 등록
        canvas.on('object:added', onObjectAdded);
        canvas.on('object:modified', onObjectModified);
        canvas.on('object:removed', onObjectRemoved);
        canvas.on('path:created', onPathCreated);
        canvas.on('object:moving', onObjectMoving);
        canvas.on('object:rotating', onObjectMoving);

        // 정기적인 상태 체크 (연결 끊김 방지)
        const healthCheckInterval = setInterval(() => {
            if (socket.connected) {
                socket.emit('ping', { room });
            } else {
                console.log('Socket disconnected, attempting reconnect...');
                socket.connect();
            }
        }, 10000);

        // 클린업
        return () => {
            console.log('Cleaning up collaborative canvas');

            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }

            clearInterval(healthCheckInterval);

            canvas.off('object:added', onObjectAdded);
            canvas.off('object:modified', onObjectModified);
            canvas.off('object:removed', onObjectRemoved);
            canvas.off('path:created', onPathCreated);
            canvas.off('object:moving', onObjectMoving);
            canvas.off('object:rotating', onObjectMoving);

            ydoc.off('update', onLocalYUpdate);
            socket.disconnect();
            ydoc.destroy();

            lastSyncHashRef.current.clear();
        };
    }, [canvas, room]);
}
