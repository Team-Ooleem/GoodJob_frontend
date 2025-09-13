'use client';

import { useEffect, useRef, useState } from 'react';

export const useDragPosition = (initialPos = { x: 40, y: 100 }) => {
    const [pos, setPos] = useState(initialPos);
    const dragState = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({
        dragging: false,
        offsetX: 0,
        offsetY: 0,
    });

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragState.current.dragging) return;
            const nextX = e.clientX - dragState.current.offsetX;
            const nextY = e.clientY - dragState.current.offsetY;
            const maxX = window.innerWidth - 280;
            const maxY = window.innerHeight - 180;
            setPos({
                x: Math.max(0, Math.min(nextX, maxX)),
                y: Math.max(0, Math.min(nextY, maxY)),
            });
        };

        const onUp = () => {
            dragState.current.dragging = false;
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
        dragState.current.dragging = true;
        dragState.current.offsetX = e.clientX - rect.left;
        dragState.current.offsetY = e.clientY - rect.top;
    };

    return { pos, handleMouseDown };
};
