'use client';

import { create } from 'zustand';
import * as fabric from 'fabric';

type BrushKind = 'pencil' | 'highlighter';

type BrushConfig = {
    color: string;
    width: number;
    type: BrushKind;
};

type StickyNoteConfig = {
    width: number;
    minHeight: number;
    padding: number;
};

type CanvasStoreState = {
    canvasInstance: fabric.Canvas | null;
    isDrawingMode: boolean;
    brush: BrushConfig;
    isEraserMode: boolean;
    isStickyMode: boolean;
    stickyNoteConfig: StickyNoteConfig;

    // history
    isLocked: boolean;
    history: fabric.Object[];

    // lifecycle
    setCanvasInstance: (canvas: fabric.Canvas | null) => void;

    // drawing
    setDrawingMode: (enabled: boolean) => void;
    setBrushOptions: (options: Partial<BrushConfig>) => void;
    setEraserMode: (enabled: boolean) => void;

    // objects
    deleteActiveObject: () => void;
    clearAllObjects: () => void;
    setStickyMode: (enabled: boolean) => void;
    addStickyNote: (x: number, y: number, text?: string) => void;
    setStickyNoteConfig: (config: Partial<StickyNoteConfig>) => void;

    // history
    saveHistory: () => void;
    addHistory: (poppedObject: fabric.Object) => void;
    undo: () => void;
    redo: () => void;
};

type DrawingBrush = fabric.PencilBrush | fabric.SprayBrush;

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
    canvasInstance: null,
    isDrawingMode: false,
    brush: { color: '#000000', width: 3, type: 'pencil' },
    isEraserMode: false,
    isStickyMode: false,
    stickyNoteConfig: {
        width: 200,
        minHeight: 150,
        padding: 10,
    },
    isLocked: false,
    history: [],

    setStickyNoteConfig: (config) =>
        set((state) => ({
            stickyNoteConfig: { ...state.stickyNoteConfig, ...config },
        })),

    setCanvasInstance: (canvas) => {
        const previousCanvas = get().canvasInstance;
        if (previousCanvas === canvas) return;

        set({ canvasInstance: canvas });

        if (canvas) {
            // 새 캔버스에 현재 브러시 세팅 재적용
            ensureFreeDrawingBrush(canvas, get().brush);
        }
    },

    // TODO: 책임이 많아서 단축키가 제대로 작동하지 않는 문제가 생긴다면 여기를 먼저 확인할 것
    setEraserMode: (enabled) =>
        set((state) => {
            const canvas = state.canvasInstance;
            if (canvas && enabled) {
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

    setStickyMode: (enabled) =>
        set(() => {
            const canvas = get().canvasInstance;
            if (canvas) {
                canvas.isDrawingMode = false;
                canvas.freeDrawingBrush = undefined;
            }
            return { isStickyMode: enabled, isDrawingMode: false, isEraserMode: false };
        }),

    addStickyNote: (x, y, text = '') => {
        const canvas = get().canvasInstance;
        if (!canvas) return;

        const { width: rectWidth, minHeight: minRectHeight, padding } = get().stickyNoteConfig;

        const shadow = new fabric.Shadow({
            color: 'rgba(0,0,0,0.2)',
            blur: 10,
            offsetX: 0,
            offsetY: 2,
        });

        // 중심 좌표를 기준으로 왼쪽 위 좌표 계산
        const rectLeft = x - rectWidth / 2;
        const rectTop = y - minRectHeight / 2;

        // 배경 Rect
        const rect = new fabric.Rect({
            left: rectLeft,
            top: rectTop,
            width: rectWidth,
            height: minRectHeight,
            fill: '#FFEB3B',
            selectable: false, // 직접 선택 불가
            evented: true, // 이벤트는 받음
            shadow,
        });

        // 텍스트 박스
        const textbox = new fabric.Textbox(text, {
            left: rectLeft + padding,
            top: rectTop + padding,
            width: rectWidth - padding * 2,
            height: minRectHeight - padding * 2,
            fontSize: 16,
            fontFamily: 'Arial',
            fill: '#333',
            textAlign: 'left',
            editable: true,
            splitByGrapheme: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
            hasControls: false,
        });

        // 텍스트 입력 → 배경 크기 늘리기
        textbox.on('changed', () => {
            const neededHeight = Math.max(textbox.height + padding * 2, minRectHeight);
            rect.set({ height: neededHeight });
            textbox.set({ height: neededHeight - padding * 2 });
            canvas.requestRenderAll();
        });

        // 텍스트 이동 → 배경 따라오기
        textbox.on('moving', () => {
            rect.set({
                left: textbox.left! - padding,
                top: textbox.top! - padding,
            });
        });

        // 배경 클릭 → 텍스트 선택
        rect.on('mousedown', () => {
            canvas.setActiveObject(textbox);
            canvas.renderAll();
        });

        // 삭제 동기화 (텍스트가 지워지면 배경도 같이 제거)
        textbox.on('removed', () => {
            canvas.remove(rect);
        });

        // 더블클릭 시 편집
        textbox.on('mousedblclick', () => {
            textbox.enterEditing();
            textbox.hiddenTextarea?.focus();
        });

        // 캔버스에 추가
        canvas.add(rect);
        canvas.add(textbox);

        const initialHeight = Math.max(textbox.height + padding * 2, minRectHeight);
        rect.set({ height: initialHeight });
        textbox.set({ height: initialHeight - padding * 2 });

        // 생성 직후 자동 편집
        canvas.setActiveObject(textbox);
        canvas.renderAll();
        textbox.enterEditing();
        textbox.hiddenTextarea?.focus();

        // 스티커 모드 해제
        useCanvasStore.setState({ isStickyMode: false });
    },

    deleteActiveObject: () => {
        const canvas = get().canvasInstance;
        if (!canvas) return;

        const activeObjects = canvas.getActiveObjects(); // 항상 배열 리턴

        if (activeObjects.length) {
            activeObjects.forEach((obj) => canvas.remove(obj));
        }

        canvas.discardActiveObject();
        canvas.requestRenderAll();
    },

    clearAllObjects: () => {
        const canvas = get().canvasInstance;
        if (!canvas) return;

        // 배경은 유지하고 오브젝트만 제거
        canvas.getObjects().forEach((object) => canvas.remove(object));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    },

    saveHistory: () => {
        const isLocked = get().isLocked;
        if (!isLocked) {
            // setHistory([]);
            set({ history: [] });
        }
        set({ isLocked: false });
    },

    addHistory: (poppedObject?: fabric.Object) =>
        set((state) => ({
            history: poppedObject ? [...state.history, poppedObject] : state.history,
        })),

    undo: () => {
        const canvas = get().canvasInstance;
        if (canvas) {
            if (canvas._objects.length > 0) {
                const poppedObject = canvas._objects.pop() as fabric.Object;
                get().addHistory(poppedObject);
                canvas.renderAll();
            }
        }
    },

    redo: () => {
        const canvas = get().canvasInstance;
        const history = get().history;
        if (canvas && history) {
            if (history.length > 0) {
                set({ isLocked: true });
                canvas.add(history[history.length - 1]);
                const newHistory = history.slice(0, -1);
                set({ history: newHistory });
            }
        }
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
