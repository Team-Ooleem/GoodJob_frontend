'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '../_stores/useCanvasStore';

export const useStickyNote = () => {
    const canvas = useCanvasStore((s) => s.canvasInstance);

    useEffect(() => {
        if (!canvas) return;

        const { width: rectWidth, minHeight: minRectHeight } =
            useCanvasStore.getState().stickyNoteConfig;

        // 미리보기 rect
        const preview = new fabric.Rect({
            left: -9999,
            top: -9999,
            width: rectWidth,
            height: minRectHeight,
            fill: 'rgba(255, 235, 59, 0.4)', // 반투명 노란색
            selectable: false,
            evented: false,
        });

        canvas.add(preview);
        canvas.requestRenderAll();

        // 마우스 이동 → preview 위치 업데이트
        const handleMouseMove = (opt: fabric.TPointerEventInfo) => {
            const { isStickyMode } = useCanvasStore.getState();

            if (!isStickyMode) {
                preview.set({ left: -9999, top: -9999 });
                canvas.requestRenderAll();
                return;
            }

            const { scenePoint } = opt;
            preview.set({
                left: scenePoint.x - rectWidth / 2,
                top: scenePoint.y - minRectHeight / 2,
            });

            // preview를 맨 위로 올리기
            canvas.remove(preview);
            canvas.add(preview);

            canvas.requestRenderAll();
        };

        // 마우스 클릭 → 실제 스티커 생성
        const handleMouseDown = (opt: fabric.TPointerEventInfo) => {
            const { isStickyMode, addStickyNote } = useCanvasStore.getState();
            if (!isStickyMode) return;

            const { scenePoint } = opt;
            addStickyNote(scenePoint.x, scenePoint.y);

            // 모드 해제되면 preview 숨기기
            preview.set({ left: -9999, top: -9999 });
            canvas.requestRenderAll();
        };

        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:down', handleMouseDown);

        return () => {
            canvas.remove(preview);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:down', handleMouseDown);
        };
    }, [canvas]);
};
