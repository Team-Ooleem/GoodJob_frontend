'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '../_stores/useCanvasStore';

/**
 * 캔버스 단축키 훅
 * - Delete / Backspace : 선택된 객체 삭제
 * - V : 선택 모드(드로잉 모드 해제)
 * - M : 연필 모드(드로잉 모드 활성화)
 * - Shift + M : 형광펜 모드(드로잉 모드 활성화 + 브러시 전환)
 */
export const useCanvasShortCut = () => {
    const deleteActiveObject = useCanvasStore((store) => store.deleteActiveObject); // 현재 활성 객체 삭제 함수
    const setDrawingMode = useCanvasStore((store) => store.setDrawingMode); // 드로잉 모드 on/off 설정 함수
    const setBrushOptions = useCanvasStore((store) => store.setBrushOptions); // 브러시 옵션 변경 함수

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete 또는 Backspace 키 입력 시 현재 선택된 객체 삭제
            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteActiveObject();
            }

            // V 키 입력 시 드로잉 모드 해제 → 선택 모드로 전환
            if (e.code === 'KeyV') {
                setDrawingMode(false);
            }

            // Shift + M → 형광펜 모드
            if (e.code === 'KeyM' && e.shiftKey) {
                setDrawingMode(true);
                setBrushOptions({ type: 'highlighter' });
            }

            // M → 연필 모드
            else if (e.code === 'KeyM') {
                setDrawingMode(true);
                setBrushOptions({ type: 'pencil' });
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [deleteActiveObject, setDrawingMode]);
};
