'use client';

import { useEffect } from 'react';

// global hooks
import { useWindowSize } from '@/hooks';

// local hooks
import {
    useFabricCanvas,
    useFabricDotGrid,
    useCollaborativeCanvas,
    useZoomPan,
    useCanvasShortCut,
    useEraser,
    useStickyNote,
} from '../_hooks';

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

    // 줌 인, 아웃 / 휠 이동
    useZoomPan(canvas);

    // 지우개 모드
    useEraser();

    // 캔버스 관련 단축키 관리
    useCanvasShortCut();

    // 스티커 메모
    useStickyNote();

    // 화면 공유 소켓 접속
    useCollaborativeCanvas('resume-room');

    return <canvas ref={canvasRef} />;
}
