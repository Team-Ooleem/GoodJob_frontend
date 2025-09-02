'use client';

// global hooks
import { useWindowSize } from '@/hooks';

// local hooks
import { useFabricCanvas, useFabricDotGrid } from '../_hooks';

export function FabricCanvas() {
    const { width, height } = useWindowSize();
    const { canvasRef, canvas } = useFabricCanvas({
        width,
        height,
    });
    useFabricDotGrid(canvas, {
        gap: 22,
        dot: 2,
        color: 'rgba(100,116,139,0.5)',
        opacity: 1,
    });

    return <canvas ref={canvasRef} />;
}
