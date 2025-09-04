'use client';

import { create } from 'zustand';
import * as fabric from 'fabric';

type BrushKind = 'pencil' | 'spray';

type BrushConfig = {
    color: string;
    width: number;
    type: BrushKind;
};

type CanvasStoreState = {
    canvasInstance: fabric.Canvas | null;
    isDrawingMode: boolean;
    brush: BrushConfig;

    // lifecycle
    setCanvasInstance: (canvas: fabric.Canvas | null) => void;

    // drawing
    setDrawingMode: (enabled: boolean) => void;
    setBrushOptions: (options: Partial<BrushConfig>) => void;

    // objects
    deleteActiveObject: () => void;
    clearAllObjects: () => void;
};

type DrawingBrush = fabric.PencilBrush | fabric.SprayBrush;

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
    canvasInstance: null,
    isDrawingMode: false,
    brush: { color: '#000000', width: 3, type: 'pencil' },

    setCanvasInstance: (canvas) => {
        const previousCanvas = get().canvasInstance;
        if (previousCanvas === canvas) return;

        set({ canvasInstance: canvas });

        if (canvas) {
            // 새 캔버스에 현재 브러시 세팅 재적용
            ensureFreeDrawingBrush(canvas, get().brush);
        }
    },

    setDrawingMode: (enabled) => {
        const canvas = get().canvasInstance;
        if (!canvas) return;

        canvas.isDrawingMode = enabled;
        set({ isDrawingMode: enabled });

        if (enabled) {
            ensureFreeDrawingBrush(canvas, get().brush);
        }
    },

    setBrushOptions: (options) => {
        const canvas = get().canvasInstance;
        const nextBrush = { ...get().brush, ...options };
        set({ brush: nextBrush });

        if (!canvas) return;
        ensureFreeDrawingBrush(canvas, nextBrush);
    },

    deleteActiveObject: () => {
        const canvas = get().canvasInstance;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.remove(activeObject);
            canvas.requestRenderAll();
        }
    },

    clearAllObjects: () => {
        const canvas = get().canvasInstance;
        if (!canvas) return;

        // 배경은 유지하고 오브젝트만 제거
        canvas.getObjects().forEach((object) => canvas.remove(object));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    },
}));

// TODO: 삼항연산자가 무분별하게 많이 쓰여져 있음
function ensureFreeDrawingBrush(canvas: fabric.Canvas, brushConfig: BrushConfig) {
    const needsNewBrush =
        !canvas.freeDrawingBrush ||
        (brushConfig.type === 'pencil' &&
            !(canvas.freeDrawingBrush instanceof fabric.PencilBrush)) ||
        (brushConfig.type === 'spray' && !(canvas.freeDrawingBrush instanceof fabric.SprayBrush));

    if (needsNewBrush) {
        canvas.freeDrawingBrush =
            brushConfig.type === 'spray'
                ? new fabric.SprayBrush(canvas)
                : new fabric.PencilBrush(canvas);
    }

    const brush = canvas.freeDrawingBrush as DrawingBrush;
    brush.width = brushConfig.width;
    brush.color = brushConfig.color;
}
