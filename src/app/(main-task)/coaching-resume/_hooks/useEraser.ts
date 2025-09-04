'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '../_stores/useCanvasStore';

function hasStrokeTest(
    o: fabric.Object,
): o is fabric.Object & { isPointNearStroke: (p: fabric.Point, tol: number) => boolean } {
    return typeof (o as any).isPointNearStroke === 'function';
}

/**
 * 지우개 모드 훅
 * - 지우개 모드일 때 마우스로 드래그하면
 *   커서 위치와 겹치는 객체들을 삭제
 */
export function useEraser() {
    const canvas = useCanvasStore((store) => store.canvasInstance);
    const isEraserMode = useCanvasStore((store) => store.isEraserMode);

    useEffect(() => {
        if (!canvas) return;

        let isErasing = false;

        const handleMouseDown = () => {
            if (isEraserMode) {
                canvas.selection = false;
                isErasing = true;
            }
        };

        const handleMouseUp = () => {
            isErasing = false;
            canvas.selection = true;
        };

        const handleMouseMove = (e: fabric.TPointerEventInfo) => {
            if (!isEraserMode || !isErasing) return;

            const pointer = canvas.getScenePoint(e.e);
            const objects = canvas.getObjects();

            objects.forEach((obj) => {
                if (obj instanceof fabric.Path) {
                    if (hasStrokeTest(obj) && obj.isPointNearStroke(pointer, 6)) {
                        canvas.remove(obj);
                    } else if (obj.containsPoint(pointer)) {
                        canvas.remove(obj);
                    }
                }
            });

            canvas.requestRenderAll();
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:up', handleMouseUp);
        canvas.on('mouse:move', handleMouseMove);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:up', handleMouseUp);
            canvas.off('mouse:move', handleMouseMove);
        };
    }, [canvas, isEraserMode]);
}
