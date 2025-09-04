'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '../_stores/useCanvasStore';

/**
 * 캔버스 단축키 훅
 * - Delete / Backspace : 선택된 객체 삭제
 * - V : 선택 모드(드로잉 모드 해제)
 */
export const useCanvasShortCut = () => {
    const deleteActiveObject = useCanvasStore((store) => store.deleteActiveObject); // 현재 활성 객체 삭제 함수
    const setDrawingMode = useCanvasStore((store) => store.setDrawingMode); // 드로잉 모드 on/off 설정 함수

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
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [deleteActiveObject, setDrawingMode]);
};
