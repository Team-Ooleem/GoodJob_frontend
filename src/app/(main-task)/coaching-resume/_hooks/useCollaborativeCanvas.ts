'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../_stores';
import * as Y from 'yjs';
import * as fabric from 'fabric';

type BrushKind = 'pencil' | 'highlighter';

type BrushConfig = {
    color: string;
    width: number;
    type: BrushKind;
};

type FabricObject = fabric.Object & {
    id?: string;
};

const makeId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const enlivenObjects = (arr: any[]): Promise<fabric.Object[]> =>
    (fabric.util.enlivenObjects as unknown as (a: any[]) => Promise<fabric.Object[]>)(arr);

const ensureId = (obj: FabricObject) => {
    if (!obj.id) obj.id = makeId();
    return obj.id;
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
    const brushConfig = useCanvasStore((s) => s.brush);

    const syncTimeoutRef = useRef<NodeJS.Timeout>();
    const isApplyingRemoteRef = useRef(false);
    const undoManagerRef = useRef<Y.UndoManager | null>(null);
    const canvasSnapshotsRef = useRef<any[]>([]);
    const currentSnapshotIndexRef = useRef(-1);

    // FreeDrawing 상태 추적
    const isDrawingRef = useRef(false);
    const currentPathIdRef = useRef<string | null>(null);
    const currentBrushRef = useRef<BrushConfig>(brushConfig);

    useEffect(() => {
        currentBrushRef.current = brushConfig;
    }, [brushConfig]);

    useEffect(() => {
        if (!canvas || !socket) return;

        socket.on('connect', () => {
            console.log('Socket connected, joining room:', room);
            socket.emit('joinCanvas', room);
        });

        if (socket.connected) {
            console.log('Socket already connected, joining room immediately:', room);
            socket.emit('joinCanvas', room);
        }

        const ydoc = new Y.Doc();
        const yObjects = ydoc.getMap<any>('objects');

        // --- Undo/Redo 스냅샷 관리 ---
        const saveSnapshot = () => {
            const snapshot = Array.from(yObjects.entries());
            canvasSnapshotsRef.current = canvasSnapshotsRef.current.slice(
                0,
                currentSnapshotIndexRef.current + 1,
            );
            canvasSnapshotsRef.current.push(snapshot);
            currentSnapshotIndexRef.current++;
            if (canvasSnapshotsRef.current.length > 50) {
                canvasSnapshotsRef.current.shift();
                currentSnapshotIndexRef.current--;
            }
        };

        const restoreSnapshot = async (snapshot: any[]) => {
            isApplyingRemoteRef.current = true;
            try {
                Y.transact(ydoc, () => {
                    yObjects.clear();
                    snapshot.forEach(([key, value]) => {
                        yObjects.set(key, value);
                    });
                });
                await syncFromY();
            } finally {
                setTimeout(() => {
                    isApplyingRemoteRef.current = false;
                }, 100);
            }
        };

        const performUndo = async () => {
            if (currentSnapshotIndexRef.current > 0) {
                currentSnapshotIndexRef.current--;
                const snapshot = canvasSnapshotsRef.current[currentSnapshotIndexRef.current];
                await restoreSnapshot(snapshot);
            }
        };

        const performRedo = async () => {
            if (currentSnapshotIndexRef.current < canvasSnapshotsRef.current.length - 1) {
                currentSnapshotIndexRef.current++;
                const snapshot = canvasSnapshotsRef.current[currentSnapshotIndexRef.current];
                await restoreSnapshot(snapshot);
            }
        };

        saveSnapshot();
        (window as any).__collaborativeUndo = performUndo;
        (window as any).__collaborativeRedo = performRedo;
        (window as any).__currentRoom = room;

        // --- Yjs 이벤트 ---
        const onLocalYUpdate = (u8: Uint8Array, origin: any) => {
            if (origin === 'remote') return;
            socket.emit('sync', { room, update: Array.from(u8) });
        };
        ydoc.on('update', onLocalYUpdate);

        const applyRemoteUpdate = async (u8: Uint8Array) => {
            isApplyingRemoteRef.current = true;
            try {
                Y.applyUpdate(ydoc, u8, 'remote');
                await syncFromY();
            } finally {
                isApplyingRemoteRef.current = false;
            }
        };

        socket.on('init', (payload: unknown) => {
            applyRemoteUpdate(toU8(payload));
        });
        socket.on('update', (payload: unknown) => {
            applyRemoteUpdate(toU8(payload));
        });

        // --- Y.js → Fabric ---
        const syncFromY = async () => {
            const existing = new Map<string, FabricObject>();
            canvas.getObjects().forEach((obj) => {
                const fo = obj as FabricObject;
                if (fo.id) existing.set(fo.id, fo);
            });

            for (const [id, data] of yObjects.entries()) {
                const [obj] = (await enlivenObjects([data])) as FabricObject[];
                obj.id = id;

                if (existing.has(id)) {
                    canvas.remove(existing.get(id)!);
                    existing.delete(id);
                }
                canvas.add(obj);
            }

            existing.forEach((obj) => canvas.remove(obj));
            canvas.requestRenderAll();
        };

        // --- Fabric → Y.js ---
        const syncToY = () => {
            if (isApplyingRemoteRef.current) return;
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

            syncTimeoutRef.current = setTimeout(() => {
                Y.transact(ydoc, () => {
                    const ids = new Set<string>();
                    canvas.getObjects().forEach((obj) => {
                        if (obj instanceof fabric.ActiveSelection) return;
                        const fo = obj as FabricObject;
                        if ((fo as any).__isRealTimePath) return;

                        const id = ensureId(fo);
                        ids.add(id);
                        const data = fo.toObject();
                        data.id = id;
                        yObjects.set(id, data);
                    });

                    Array.from(yObjects.keys()).forEach((id) => {
                        if (!ids.has(id)) yObjects.delete(id);
                    });
                });

                setTimeout(() => {
                    if (!isApplyingRemoteRef.current) {
                        saveSnapshot();
                    }
                }, 50);
            }, 30);
        };

        // --- FreeDrawing ---
        const handleMouseDown = () => {
            if (!canvas.isDrawingMode) return;
            isDrawingRef.current = true;
            currentPathIdRef.current = makeId();
            socket.emit('drawing:start', {
                room,
                id: currentPathIdRef.current,
                brush: currentBrushRef.current,
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
                brush: currentBrushRef.current,
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

        socket.on('drawing:start', ({ id, brush }) => {
            const { color, width, type } = brush as BrushConfig;
            const path = new fabric.Path('', {
                stroke: type === 'highlighter' ? 'rgba(255,255,0,0.3)' : color,
                strokeWidth: type === 'highlighter' ? width * 1.2 : width,
                fill: null,
                selectable: false,
            }) as FabricObject;
            path.id = id;
            (path as any).__isRealTimePath = true;
            canvas.add(path);
        });

        socket.on('drawing:progress', ({ id, points, brush }) => {
            const oldPath = canvas
                .getObjects()
                .find((o) => (o as FabricObject).id === id) as fabric.Path;
            if (oldPath) canvas.remove(oldPath);

            const pathData = points
                .map((p: number[], i: number) =>
                    i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`,
                )
                .join(' ');

            const { color, width, type } = brush as BrushConfig;
            const strokeColor = type === 'highlighter' ? 'rgba(255,255,0,0.3)' : color;
            const strokeWidth = type === 'highlighter' ? width * 1.2 : width;

            const newPath = new fabric.Path(pathData, {
                stroke: strokeColor,
                strokeWidth,
                fill: null,
                selectable: false,
            }) as FabricObject;
            newPath.id = id;
            (newPath as any).__isRealTimePath = true;
            canvas.add(newPath);
            canvas.requestRenderAll();
        });

        socket.on('drawing:end', ({ id }) => {
            const obj = canvas.getObjects().find((o) => (o as FabricObject).id === id);
            if (obj) ensureId(obj as FabricObject);
        });

        socket.on('canvas:undo', () => performUndo());
        socket.on('canvas:redo', () => performRedo());

        const onObjectAdded = (e: any) => {
            const obj = e.target as FabricObject;
            if (obj.id && (isDrawingRef.current || isApplyingRemoteRef.current)) return;
            syncToY();
        };

        const onPathCreated = () => {
            if (isDrawingRef.current) return;
            syncToY();
        };

        canvas.on('object:added', onObjectAdded);
        canvas.on('object:modified', () => syncToY());
        canvas.on('object:removed', () => syncToY());
        canvas.on('path:created', onPathCreated);
        canvas.on('object:moving', () => syncToY());
        canvas.on('object:rotating', () => syncToY());
        canvas.on('object:scaling', () => syncToY());

        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            canvas.off('object:added', onObjectAdded);
            canvas.off('object:modified');
            canvas.off('object:removed');
            canvas.off('path:created', onPathCreated);
            canvas.off('object:moving');
            canvas.off('object:rotating');
            canvas.off('object:scaling');
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);

            socket.off('init');
            socket.off('update');
            socket.off('drawing:start');
            socket.off('drawing:progress');
            socket.off('drawing:end');
            socket.off('canvas:undo');
            socket.off('canvas:redo');

            ydoc.off('update', onLocalYUpdate);
            ydoc.destroy();

            delete (window as any).__collaborativeUndo;
            delete (window as any).__collaborativeRedo;
            if ((window as any).__currentRoom === room) delete (window as any).__currentRoom;

            canvasSnapshotsRef.current = [];
            currentSnapshotIndexRef.current = -1;
            undoManagerRef.current = null;
        };
    }, [canvas, socket, room]);
}
