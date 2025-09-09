'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../_stores/useCanvasStore';

type RemoteCursor = {
    clientUUID: string;
    x: number;
    y: number;
};

function getClientUUID() {
    let id = localStorage.getItem('clientUUID');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('clientUUID', id);
    }
    return id;
}

export function useCollaborativeCursor(room: string) {
    const socket = useCanvasStore((s) => s.socket);
    const cursorsRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const clientUUID = getClientUUID();

    useEffect(() => {
        if (!socket) return;

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

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);

            cursorsRef.current.forEach((el) => el.remove());
            cursorsRef.current.clear();

            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('cursor', handleCursor);
            socket.off('user-left', handleUserLeft);
        };
    }, [socket, room, clientUUID]);
}
