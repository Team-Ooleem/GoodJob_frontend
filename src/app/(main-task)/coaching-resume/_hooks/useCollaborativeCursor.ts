'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../_stores/useCanvasStore';

type RemoteCursor = {
    clientUUID: string;
    x: number;
    y: number;
};

function safeRandomUUID(): string {
    const c = (globalThis as any)?.crypto as Crypto | undefined;
    if (c?.randomUUID) {
        return c.randomUUID();
    }
    if (c?.getRandomValues) {
        const bytes = new Uint8Array(16);
        c.getRandomValues(bytes);
        // Per RFC 4122 v4
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        const hex = Array.from(bytes, toHex).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    // Last-resort fallback (lower entropy)
    let d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

function getClientUUID() {
    if (typeof window === 'undefined') {
        // SSR/Node fallback (non-persistent)
        return safeRandomUUID();
    }
    try {
        let id = window.localStorage.getItem('clientUUID');
        if (!id) {
            id = safeRandomUUID();
            window.localStorage.setItem('clientUUID', id);
        }
        return id;
    } catch {
        // Access to localStorage might throw (privacy mode). Fall back to non-persistent.
        return safeRandomUUID();
    }
}

export function useCollaborativeCursor(room: string) {
    const socket = useCanvasStore((s) => s.socket);
    const cursorsRef = useRef<Map<string, HTMLImageElement>>(new Map());

    useEffect(() => {
        if (!socket) return;

        const clientUUID = getClientUUID();

        // --- 내 커서 위치 전송 ---
        const handleMouseMove = (e: MouseEvent) => {
            socket.emit('cursor', {
                room,
                clientUUID,
                x: e.pageX,
                y: e.pageY,
            });
        };

        const handleConnect = () => {
            console.log('✅ connected for cursor, joining room:', room);
            socket.emit('join', { room, clientUUID });
            window.addEventListener('mousemove', handleMouseMove);
        };

        const handleDisconnect = () => {
            console.log('❌ disconnected from cursor socket');
            window.removeEventListener('mousemove', handleMouseMove);
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
                // tip alignment (slight offset so the pointer tip matches the coordinate)
                cursorEl.style.transform = 'translate(-2px, -2px)';
                document.body.appendChild(cursorEl);
                cursorsRef.current.set(remoteId, cursorEl);
            }

            cursorEl.style.left = `${x}px`;
            cursorEl.style.top = `${y}px`;
        };

        // --- 다른 사람 나감 ---
        const handleUserLeft = (remoteId: string) => {
            const cursorEl = cursorsRef.current.get(remoteId);
            if (cursorEl) {
                cursorEl.remove();
                cursorsRef.current.delete(remoteId);
            }
        };

        // 이벤트 등록
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('cursor', handleCursor);
        socket.on('user-left', handleUserLeft);

        // 이미 연결되어 있다면 즉시 참여
        if (socket.connected) {
            handleConnect();
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);

            cursorsRef.current.forEach((el) => el.remove());
            cursorsRef.current.clear();

            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('cursor', handleCursor);
            socket.off('user-left', handleUserLeft);
        };
    }, [socket, room]);
}
