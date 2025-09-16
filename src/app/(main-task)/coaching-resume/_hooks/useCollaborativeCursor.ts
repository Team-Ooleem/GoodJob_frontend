'use client';

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../_stores/useCanvasStore';
import { useSessionStore } from '../_stores/useSessionStore';
import * as fabric from 'fabric';

type RemoteCursor = {
    clientUUID: string;
    x: number; // 월드 좌표
    y: number; // 월드 좌표
    userName?: string; // 사용자 이름
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

function getUserName(): string {
    if (typeof window === 'undefined') return 'Anonymous';
    try {
        // localStorage에서 사용자 이름을 가져오거나 기본값 설정
        const userName = window.localStorage.getItem('userName');
        if (userName) return userName;

        // 랜덤한 사용자 이름 생성
        const names = ['Alex', 'Jordan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Blake', 'Sage'];
        const randomName =
            names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
        window.localStorage.setItem('userName', randomName);
        return randomName;
    } catch {
        return 'Anonymous';
    }
}

export function useCollaborativeCursor(room: string, canvas: fabric.Canvas | null) {
    const socket = useCanvasStore((s) => s.socket);
    const cursorsRef = useRef<Map<string, HTMLDivElement>>(new Map());

    useEffect(() => {
        if (!socket || !canvas) return;
        const clientUUID = getClientUUID();
        const userName = getUserName();

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
                userName,
            });
        };

        const handleConnect = () => {
            console.log('✅ connected for cursor, joining room:', room);
            socket.emit('joinCursor', { room, clientUUID, userName });
            canvas.on('mouse:move', handleMouseMove);
        };

        const handleDisconnect = () => {
            console.log('❌ disconnected from cursor socket');
            canvas.off('mouse:move', handleMouseMove);
        };

        // --- 다른 사람 커서 업데이트 ---
        const handleCursor = ({
            clientUUID: remoteId,
            x,
            y,
            userName: remoteUserName,
        }: RemoteCursor) => {
            if (remoteId === clientUUID) return;

            let cursorContainer = cursorsRef.current.get(remoteId);
            if (!cursorContainer) {
                // 커서 컨테이너 생성
                cursorContainer = document.createElement('div');
                cursorContainer.style.position = 'absolute';
                cursorContainer.style.pointerEvents = 'none';
                cursorContainer.style.userSelect = 'none';
                cursorContainer.style.zIndex = '9999';
                cursorContainer.style.transform = 'translate(-2px, -2px)';

                // 커서 이미지
                const cursorImg = document.createElement('img');
                cursorImg.src = '/assets/cursor.png';
                cursorImg.alt = 'remote-cursor';
                cursorImg.style.width = '24px';
                cursorImg.style.height = '24px';
                cursorImg.style.display = 'block';

                // 사용자 이름 라벨
                const nameLabel = document.createElement('div');
                nameLabel.textContent = remoteUserName || 'Anonymous';
                nameLabel.style.position = 'absolute';
                nameLabel.style.top = '36px';
                nameLabel.style.left = '0px';
                nameLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                nameLabel.style.color = 'white';
                nameLabel.style.fontSize = '12px';
                nameLabel.style.padding = '2px 6px';
                nameLabel.style.borderRadius = '4px';
                nameLabel.style.whiteSpace = 'nowrap';
                nameLabel.style.fontFamily = 'system-ui, -apple-system, sans-serif';

                cursorContainer.appendChild(cursorImg);
                cursorContainer.appendChild(nameLabel);
                container.appendChild(cursorContainer);
                cursorsRef.current.set(remoteId, cursorContainer);
            }

            // --- 월드 좌표 → 화면 좌표 변환 ---
            const t = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
            const screenX = x * t[0] + t[4];
            const screenY = y * t[3] + t[5];

            // viewport 안에 있는지 체크
            const rect = canvas.upperCanvasEl.getBoundingClientRect();
            if (screenX < 0 || screenX > rect.width || screenY < 0 || screenY > rect.height) {
                cursorContainer.style.display = 'none';
                return;
            }
            cursorContainer.style.display = 'block';
            cursorContainer.style.left = `${screenX}px`;
            cursorContainer.style.top = `${screenY}px`;

            // 디버깅 로그
            // console.log('📥 recv cursor', remoteId, { worldX: x, worldY: y, screenX, screenY });
        };

        // --- 다른 사람 나감 ---
        const handleUserLeft = (remoteId: string) => {
            const cursorContainer = cursorsRef.current.get(remoteId);
            if (cursorContainer) {
                cursorContainer.remove();
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
