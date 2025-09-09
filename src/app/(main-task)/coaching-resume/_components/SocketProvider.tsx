'use client';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useCanvasStore } from '../_stores/useCanvasStore';
import { BACKEND_ORIGIN } from '@/constants/config';

export function SocketProvider() {
    const setSocket = useCanvasStore((s) => s.setSocket);

    useEffect(() => {
        const socket = io(BACKEND_ORIGIN, {
            withCredentials: true,
            transports: ['websocket'],
        });

        setSocket(socket);

        return () => {
            socket.disconnect();
            setSocket(null);
        };
    }, [setSocket]);

    return null;
}
