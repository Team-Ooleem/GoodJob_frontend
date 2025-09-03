'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';

// global hooks
import { useWindowSize } from '@/hooks';

// local hooks
import { useFabricCanvas, useFabricDotGrid, useCollaborativeCanvas } from '../_hooks';

// local stores
import { useCanvasStore } from '../_stores';

export function FabricCanvas() {
    const { width, height } = useWindowSize();
    const { canvasRef, canvas } = useFabricCanvas({
        width,
        height,
    });

    // 배경 dot grid 그리는 훅
    useFabricDotGrid(canvas, {
        gap: 22,
        dot: 2,
        color: 'rgba(100,116,139,0.5)',
        opacity: 1,
    });

    const setCanvasInstance = useCanvasStore((store) => store.setCanvasInstance);

    useEffect(() => {
        if (!canvas) {
            return;
        }

        setCanvasInstance(canvas);

        return () => {
            setCanvasInstance(null);
        };
    }, [canvas, setCanvasInstance]);

    useCollaborativeCanvas('resume-room');

    return <canvas ref={canvasRef} />;
}
