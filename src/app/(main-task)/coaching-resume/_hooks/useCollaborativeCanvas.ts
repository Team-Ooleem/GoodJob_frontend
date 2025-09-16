'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../_stores';
import * as Y from 'yjs';
import * as fabric from 'fabric';

type FabricObject = fabric.Object & {
    id?: string;
    __fromRemote?: boolean;
    __lastModified?: number;
};

const makeId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const enlivenObjects = (arr: any[]): Promise<fabric.Object[]> =>
    (fabric.util.enlivenObjects as unknown as (a: any[]) => Promise<fabric.Object[]>)(arr);

const ensureId = (obj: FabricObject) => {
    if (!obj.id) obj.id = makeId();
    return obj.id;
};

const getObjectHash = (obj: FabricObject): string => {
    return `${obj.left || 0}_${obj.top || 0}_${obj.angle || 0}_${obj.scaleX || 1}_${obj.scaleY || 1}`;
};

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

export function useCollaborativeCanvas(room: string) {
    const canvas = useCanvasStore((s) => s.canvasInstance);
    const socket = useCanvasStore((s) => s.socket);

    const syncTimeoutRef = useRef<NodeJS.Timeout>();
    const lastSyncHashRef = useRef<Map<string, string>>(new Map());
    const isApplyingRemoteRef = useRef(false);

    const isDrawingRef = useRef(false);
    const currentPathIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!canvas || !socket) return;

        // --- Socket 연결 ---
        socket.on('connect', () => {
            console.log('Socket connected, joining room:', room);
            socket.emit('joinCanvas', room);
        });

        // --- Y.Doc 설정 ---
        const ydoc = new Y.Doc();
        const yObjects = ydoc.getMap<any>('objects');

        const onLocalYUpdate = (u8: Uint8Array, origin: any) => {
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
                }, 50);
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

        // ----------------------------
        // FreeDrawing 실시간 스트리밍 (방법 A)
        // ----------------------------
        const handleMouseDown = () => {
            if (!canvas.isDrawingMode) return;
            isDrawingRef.current = true;
            currentPathIdRef.current = makeId();
            socket.emit('drawing:start', {
                room,
                id: currentPathIdRef.current,
            });
        };

        const handleMouseMove = () => {
            if (!canvas.isDrawingMode || !isDrawingRef.current) return;
            const brush = canvas.freeDrawingBrush as any;
            if (!brush || !brush._points) return;

            const points = brush._points.map((p: any) => [p.x, p.y]);
            socket.emit('drawing:progress', {
                room,
                id: currentPathIdRef.current,
                points,
            });
        };

        const handleMouseUp = () => {
            if (!canvas.isDrawingMode || !isDrawingRef.current) return;
            isDrawingRef.current = false;
            socket.emit('drawing:end', {
                room,
                id: currentPathIdRef.current,
            });
            currentPathIdRef.current = null;
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        // --- 원격 수신 ---
        socket.on('drawing:start', ({ id }) => {
            // 시작 시에는 일단 빈 Path를 추가
            const path = new fabric.Path('', {
                stroke: 'black',
                strokeWidth: 2,
                fill: null,
                selectable: false,
            }) as FabricObject;
            path.id = id;
            path.__fromRemote = true;
            canvas.add(path);
        });

        socket.on('drawing:progress', ({ id, points }) => {
            // 기존 Path 제거 후 새로 추가 (간단한 방식)
            const oldPath = canvas
                .getObjects()
                .find((o) => (o as FabricObject).id === id) as fabric.Path;

            if (oldPath) {
                canvas.remove(oldPath);
            }

            const pathData = points
                .map((p: number[], i: number) =>
                    i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`,
                )
                .join(' ');

            const newPath = new fabric.Path(pathData, {
                stroke: 'black',
                strokeWidth: 2,
                fill: null,
                selectable: false,
            }) as FabricObject;
            newPath.id = id;
            newPath.__fromRemote = true;

            canvas.add(newPath);
            canvas.requestRenderAll();
        });

        socket.on('drawing:end', ({ id }) => {
            const pathObj = canvas
                .getObjects()
                .find((o) => (o as FabricObject).id === id) as FabricObject;
            if (pathObj) {
                pathObj.__fromRemote = false;
            }
            canvas.requestRenderAll();
        });

        // ----------------------------
        // Y.js → Canvas 동기화
        // ----------------------------
        const syncFromY = async () => {
            if (!isApplyingRemoteRef.current) return;
            const canvasObjects = new Map<string, FabricObject>();
            canvas.getObjects().forEach((obj) => {
                const fo = obj as FabricObject;
                if (fo.id) canvasObjects.set(fo.id, fo);
            });

            const updatedObjects: FabricObject[] = [];
            for (const [id, data] of yObjects.entries()) {
                if (data.type instanceof fabric.ActiveSelection) continue;

                const existing = canvasObjects.get(id);
                const newHash = `${data.left || 0}_${data.top || 0}_${data.angle || 0}_${data.scaleX || 1}_${data.scaleY || 1}`;
                const lastHash = lastSyncHashRef.current.get(id);

                if (existing) {
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
                    try {
                        const [obj] = (await enlivenObjects([data])) as FabricObject[];
                        obj.id = id;
                        obj.__fromRemote = true;
                        obj.__lastModified = Date.now();
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

            canvasObjects.forEach((obj) => {
                obj.__fromRemote = true;
                canvas.remove(obj);
                if (obj.id) lastSyncHashRef.current.delete(obj.id);
            });

            updatedObjects.forEach((obj) => {
                setTimeout(() => {
                    obj.__fromRemote = false;
                }, 100);
            });
            canvas.requestRenderAll();
        };

        // ----------------------------
        // Canvas → Y.js 동기화
        // ----------------------------
        const syncToY = () => {
            if (isApplyingRemoteRef.current) return;
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

            syncTimeoutRef.current = setTimeout(() => {
                Y.transact(ydoc, () => {
                    const currentIds = new Set<string>();
                    canvas.getObjects().forEach((obj) => {
                        if (obj instanceof fabric.ActiveSelection) return;
                        const fo = obj as FabricObject;
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
                        const currentHash = getObjectHash(fo);
                        const lastHash = lastSyncHashRef.current.get(id);
                        if (lastHash !== currentHash) {
                            yObjects.set(id, data);
                            lastSyncHashRef.current.set(id, currentHash);
                        }
                    });

                    Array.from(yObjects.keys()).forEach((id) => {
                        if (!currentIds.has(id)) {
                            yObjects.delete(id);
                            lastSyncHashRef.current.delete(id);
                        }
                    });
                });
            }, 50);
        };

        // Fabric 이벤트
        const onObjectAdded = (e: any) => {
            const obj = e.target as FabricObject;
            if (obj.__fromRemote) return;
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
            syncToY();
            canvas.requestRenderAll();
        };

        const onObjectRemoved = (e: any) => {
            const obj = e.target as FabricObject;
            if (obj.__fromRemote) return;
            if (obj.id) lastSyncHashRef.current.delete(obj.id);
            syncToY();
        };

        const onPathCreated = () => {
            // freeDrawing 종료 후 최종 Path → Yjs에 반영
            syncToY();
        };

        const onObjectMoving = () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = setTimeout(syncToY, 16);
        };

        canvas.on('object:added', onObjectAdded);
        canvas.on('object:modified', onObjectModified);
        canvas.on('object:removed', onObjectRemoved);
        canvas.on('path:created', onPathCreated);
        canvas.on('object:moving', onObjectMoving);
        canvas.on('object:rotating', onObjectMoving);

        // --- cleanup ---
        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

            canvas.off('object:added', onObjectAdded);
            canvas.off('object:modified', onObjectModified);
            canvas.off('object:removed', onObjectRemoved);
            canvas.off('path:created', onPathCreated);
            canvas.off('object:moving', onObjectMoving);
            canvas.off('object:rotating', onObjectMoving);

            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);

            socket.off('drawing:start');
            socket.off('drawing:progress');
            socket.off('drawing:end');

            ydoc.off('update', onLocalYUpdate);
            lastSyncHashRef.current.clear();
            ydoc.destroy();
        };
    }, [canvas, socket, room]);
}
