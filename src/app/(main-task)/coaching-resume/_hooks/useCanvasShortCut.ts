'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '../_stores/useCanvasStore';

/**
 * 캔버스 단축키 훅
 * - Delete / Backspace : 선택된 객체 삭제
 * - V : 선택 모드(드로잉 모드 해제)
 * - M : 연필 모드(드로잉 모드 활성화)
 * - Shift + M : 형광펜 모드(드로잉 모드 활성화 + 브러시 전환)
 * - Shift + Backspace : 지우개 모드
 * - S : 스티커 메모 모드
 */
export const useCanvasShortCut = () => {
    const deleteActiveObject = useCanvasStore((store) => store.deleteActiveObject);
    const setDrawingMode = useCanvasStore((store) => store.setDrawingMode);
    const setBrushOptions = useCanvasStore((store) => store.setBrushOptions);
    const setEraserMode = useCanvasStore((store) => store.setEraserMode);
    const setStickyMode = useCanvasStore((store) => store.setStickyMode);
    const undo = useCanvasStore((store) => store.undo);
    const redo = useCanvasStore((store) => store.redo);
    const canvas = useCanvasStore((store) => store.canvasInstance);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // fabric.Textbox 편집 중이면 단축키 무시
            const active = canvas?.getActiveObject();
            if (active && active.type === 'textbox' && (active as fabric.Textbox).isEditing) {
                return;
            }

            // Delete 또는 Backspace → 현재 선택된 객체 삭제
            if ((e.code === 'Delete' || e.code === 'Backspace') && !e.shiftKey) {
                deleteActiveObject();
                return;
            }

            // Shift + Backspace → 지우개 모드
            if ((e.code === 'Delete' || e.code === 'Backspace') && e.shiftKey) {
                setEraserMode(true);
                return;
            }

            // V → 선택 모드
            if (e.code === 'KeyV') {
                setDrawingMode(false);
                setEraserMode(false);
                return;
            }

            // Shift + M → 형광펜
            if (e.code === 'KeyM' && e.shiftKey) {
                setDrawingMode(false);
                setBrushOptions({ type: 'highlighter', width: 20 });
                setDrawingMode(true);
                setEraserMode(false);
                return;
            }

            // M → 연필
            if (e.code === 'KeyM') {
                setDrawingMode(false);
                setBrushOptions({ type: 'pencil', color: '#000000', width: 3 });
                setDrawingMode(true);
                setEraserMode(false);
                return;
            }

            // S → 스티커 메모 모드
            if (e.code === 'KeyS') {
                setStickyMode(true);
                setDrawingMode(false);
                setEraserMode(false);
                return;
            }

            // Ctrl/Cmd + Z → Undo
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Ctrl/Cmd + Shift + Z → Redo
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && e.shiftKey) {
                e.preventDefault();
                redo();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvas, deleteActiveObject, setDrawingMode, setBrushOptions, setEraserMode]);
};
