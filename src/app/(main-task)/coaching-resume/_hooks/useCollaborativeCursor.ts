'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../_stores/useCanvasStore';
import * as fabric from 'fabric';

type RemoteCursor = {
    clientUUID: string;
    x: number; // 월드 좌표
    y: number; // 월드 좌표
};

function safeRandomUUID(): string {
    const c = (globalThis as any)?.crypto as Crypto | undefined;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
        const bytes = new Uint8Array(16);
        c.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        const hex = Array.from(bytes, toHex).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
            12,
            16,
        )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    let d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

function getClientUUID() {
    if (typeof window === 'undefined') return safeRandomUUID();
    try {
        let id = window.localStorage.getItem('clientUUID');
        if (!id) {
            id = safeRandomUUID();
            window.localStorage.setItem('clientUUID', id);
        }
        return id;
    } catch {
        return safeRandomUUID();
    }
}

export function useCollaborativeCursor(room: string, canvas: fabric.Canvas | null) {
    const socket = useCanvasStore((s) => s.socket);
    const cursorsRef = useRef<Map<string, HTMLImageElement>>(new Map());

    useEffect(() => {
        if (!socket || !canvas) return;
        const clientUUID = getClientUUID();

        const container = document.getElementById('canvas-container');
        if (!container) {
            console.warn('❗ canvas-container not found. Remote cursors will not render.');
            return;
        }
        container.style.position = 'relative';

        // --- 내 커서 위치 송신 (월드 좌표 기준) ---
        const handleMouseMove = (opt: fabric.IEvent) => {
            const e = opt.e as MouseEvent;
            const point = canvas.getPointer(e);
            if (!point) return;

            // 디버깅 로그
            // console.log('📤 send cursor', point);

            socket.emit('cursor', {
                room,
                clientUUID,
                x: point.x,
                y: point.y,
            });
        };

        const handleConnect = () => {
            console.log('✅ connected for cursor, joining room:', room);
            socket.emit('joinCursor', { room, clientUUID });
            canvas.on('mouse:move', handleMouseMove);
        };

        const handleDisconnect = () => {
            console.log('❌ disconnected from cursor socket');
            canvas.off('mouse:move', handleMouseMove);
        };

        // --- 다른 사람 커서 업데이트 ---
        const handleCursor = ({ clientUUID: remoteId, x, y }: RemoteCursor) => {
            if (remoteId === clientUUID) return;

            let cursorEl = cursorsRef.current.get(remoteId);
            if (!cursorEl) {
                cursorEl = new Image();
                cursorEl.src = '/assets/cursor.png';
                cursorEl.alt = 'remote-cursor';
                cursorEl.style.position = 'absolute';
                cursorEl.style.width = '24px';
                cursorEl.style.height = '24px';
                cursorEl.style.pointerEvents = 'none';
                cursorEl.style.userSelect = 'none';
                cursorEl.style.zIndex = '9999';
                cursorEl.style.transform = 'translate(-2px, -2px)';
                container.appendChild(cursorEl);
                cursorsRef.current.set(remoteId, cursorEl);
            }

            // --- 월드 좌표 → 화면 좌표 변환 ---
            const t = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
            const screenX = x * t[0] + t[4];
            const screenY = y * t[3] + t[5];

            // viewport 안에 있는지 체크
            const rect = canvas.upperCanvasEl.getBoundingClientRect();
            if (screenX < 0 || screenX > rect.width || screenY < 0 || screenY > rect.height) {
                cursorEl.style.display = 'none';
                return;
            }
            cursorEl.style.display = 'block';
            cursorEl.style.left = `${screenX}px`;
            cursorEl.style.top = `${screenY}px`;

            // 디버깅 로그
            // console.log('📥 recv cursor', remoteId, { worldX: x, worldY: y, screenX, screenY });
        };

        // --- 다른 사람 나감 ---
        const handleUserLeft = (remoteId: string) => {
            const cursorEl = cursorsRef.current.get(remoteId);
            if (cursorEl) {
                cursorEl.remove();
                cursorsRef.current.delete(remoteId);
            }
        };

        // 소켓 이벤트 등록
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('cursor', handleCursor);
        socket.on('user-left', handleUserLeft);

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            canvas.off('mouse:move', handleMouseMove);

            cursorsRef.current.forEach((el) => el.remove());
            cursorsRef.current.clear();

            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('cursor', handleCursor);
            socket.off('user-left', handleUserLeft);
        };
    }, [socket, room, canvas]);
}
