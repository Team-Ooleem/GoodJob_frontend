'use client';

// global hooks
import { useWindowSize } from '@/hooks';

// local hooks
import { useFabricCanvas } from '../_hooks';

export function FabricCanvas() {
    const { width, height } = useWindowSize();
    const { canvasRef, canvas } = useFabricCanvas({
        width,
        height,
    });

    return <canvas ref={canvasRef} />;
}
