'use client';

import { create } from 'zustand';
import * as fabric from 'fabric';

type BrushKind = 'pencil' | 'highlighter';

type BrushConfig = {
    color: string;
    width: number;
    type: BrushKind;
};

type CanvasStoreState = {
    canvasInstance: fabric.Canvas | null;
    isDrawingMode: boolean;
    brush: BrushConfig;
    isEraserMode: boolean;

    // lifecycle
    setCanvasInstance: (canvas: fabric.Canvas | null) => void;

    // drawing
    setDrawingMode: (enabled: boolean) => void;
    setBrushOptions: (options: Partial<BrushConfig>) => void;
    setEraserMode: (enabled: boolean) => void;

    // objects
    deleteActiveObject: () => void;
    clearAllObjects: () => void;
};

type DrawingBrush = fabric.PencilBrush | fabric.SprayBrush;

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
    canvasInstance: null,
    isDrawingMode: false,
    brush: { color: '#000000', width: 3, type: 'pencil' },
    isEraserMode: false,

    setCanvasInstance: (canvas) => {
        const previousCanvas = get().canvasInstance;
        if (previousCanvas === canvas) return;

        set({ canvasInstance: canvas });

        if (canvas) {
            // 새 캔버스에 현재 브러시 세팅 재적용
            ensureFreeDrawingBrush(canvas, get().brush);
        }
    },

    setEraserMode: (enabled) =>
        set((state) => {
            const canvas = state.canvasInstance;
            if (canvas) {
                canvas.isDrawingMode = false;
                canvas.freeDrawingBrush = undefined;
            }
            return {
                isEraserMode: enabled,
                isDrawingMode: false,
            };
        }),

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

function ensureFreeDrawingBrush(canvas: fabric.Canvas, brushConfig: BrushConfig) {
    const { type, color, width } = brushConfig;

    // 필요할 경우 새 브러시 생성
    const needsNewBrush =
        !canvas.freeDrawingBrush || !(canvas.freeDrawingBrush instanceof fabric.PencilBrush);

    if (needsNewBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    }

    const brush = canvas.freeDrawingBrush as fabric.PencilBrush;

    // 기본 설정
    brush.width = width;
    brush.color = color;

    // 형광펜 전용 옵션
    if (type === 'highlighter') {
        brush.width = width * 2; // 더 두껍게
        brush.color = 'rgba(255, 255, 0, 0.3)'; // 형광펜 색상
    }
}
