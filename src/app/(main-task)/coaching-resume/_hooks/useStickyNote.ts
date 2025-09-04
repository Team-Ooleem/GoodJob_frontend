'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';
import { useCanvasStore } from '../_stores/useCanvasStore';

export const useStickyNote = () => {
    const canvas = useCanvasStore((s) => s.canvasInstance);

    useEffect(() => {
        if (!canvas) {
            return;
        }

        const handleClick = (opt: fabric.TPointerEventInfo) => {
            const { isStickyMode, addStickyNote } = useCanvasStore.getState();
            if (!isStickyMode) {
                return;
            }

            const pointer = canvas.getScenePoint(opt.e);
            addStickyNote(pointer.x, pointer.y);
        };

        canvas.on('mouse:down', handleClick);

        return () => {
            canvas.off('mouse:down', handleClick);
        };
    }, [canvas]);
};
