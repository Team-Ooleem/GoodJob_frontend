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
    useLockTransform,
    usePdfDrop,
} from '../_hooks';

// local stores
import { useCanvasStore } from '../_stores';

// BUGS:
// 스티커 메모 생성 전 고스트 메모가 소켓으로 공유되고 있음
// 스티커 메모 생성 후 스티커 메모 옮기면 다른 PC에서 텍스트만 움직임
// 객체 트랜스폼 기능이 여러개 객체 선택하면 활성화됨 : 해결
// 객체를 생성하고 이동하면 상대방 PC에 원래 위치에 원본이 남아있고 복사되어 이동됨
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
    const saveHistory = useCanvasStore((store) => store.saveHistory);

    useEffect(() => {
        if (!canvas) {
            return;
        }

        setCanvasInstance(canvas);

        // history
        canvas.on('object:added', saveHistory);
        canvas.on('object:modified', saveHistory);
        canvas.on('object:removed', saveHistory);

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

    // 모든 객체에 대해 크기, 로테이션 조작 금지
    useLockTransform();

    // 화면 공유 소켓 접속
    useCollaborativeCanvas('resume-room');

    // pdf drag & drop
    usePdfDrop(canvasRef);

    return <canvas ref={canvasRef} />;
}
