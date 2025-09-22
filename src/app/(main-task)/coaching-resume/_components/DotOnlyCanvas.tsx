'use client';

import { useEffect } from 'react';
import { useWindowSize } from '@/hooks';
import {
    useFabricCanvas,
    useFabricDotGrid,
    useZoomPan,
    useCanvasShortCut,
    usePdfDrop,
} from '../_hooks';
import { useCanvasStore } from '../_stores';

export function DotOnlyCanvas() {
    const { width, height } = useWindowSize();
    const { canvasRef, canvas } = useFabricCanvas({
        width,
        height,
    });

    // 도트 그리드 배경
    useFabricDotGrid(canvas, {
        gap: 22,
        dot: 2,
        color: 'rgba(100,116,139,0.5)',
        opacity: 1,
    });

    const setCanvasInstance = useCanvasStore((store) => store.setCanvasInstance);

    // 캔버스 인스턴스 설정
    useEffect(() => {
        if (!canvas) return;

        setCanvasInstance(canvas);

        return () => {
            setCanvasInstance(null);
        };
    }, [canvas, setCanvasInstance]);

    // �� 줌 인, 아웃 / 휠 이동
    useZoomPan(canvas);

    // 🆕 캔버스 관련 단축키 관리
    useCanvasShortCut();

    usePdfDrop(canvasRef);

    return <canvas ref={canvasRef} className='w-full h-full' />;
}
