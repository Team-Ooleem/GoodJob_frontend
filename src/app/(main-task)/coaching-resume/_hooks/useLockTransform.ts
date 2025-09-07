'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '../_stores/useCanvasStore';

/**
 * 모든 객체(ActiveSelection 포함)에 대해
 * 이동만 허용하고, 회전/스케일/기울이기는 전부 막는 훅
 */
export const useLockTransform = () => {
    const canvas = useCanvasStore((s) => s.canvasInstance);

    useEffect(() => {
        if (!canvas) return;

        // 전역 기본값 설정 (Fabric v6는 FabricObject 사용)
        fabric.FabricObject.prototype.setControlsVisibility({
            mt: false,
            mb: false,
            ml: false,
            mr: false,
            tl: false,
            tr: false,
            bl: false,
            br: false,
            mtr: false, // 회전 핸들
        });
        fabric.FabricObject.prototype.lockScalingX = true;
        fabric.FabricObject.prototype.lockScalingY = true;
        fabric.FabricObject.prototype.lockRotation = true;
        fabric.FabricObject.prototype.lockSkewingX = true;
        fabric.FabricObject.prototype.lockSkewingY = true;

        // 이미 추가된 객체에도 적용
        canvas.getObjects().forEach((obj) => {
            obj.set({
                hasControls: false,
                lockScalingX: true,
                lockScalingY: true,
                lockRotation: true,
                lockSkewingX: true,
                lockSkewingY: true,
            });
        });

        canvas.requestRenderAll();
    }, [canvas]);
};
