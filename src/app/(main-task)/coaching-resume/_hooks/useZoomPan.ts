'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';

export function useZoomPan(canvas: fabric.Canvas | null) {
    useEffect(() => {
        if (!canvas) return;

        const handleWheel = (opt: fabric.TEvent<WheelEvent>) => {
            const e = opt.e;
            const vpt = canvas.viewportTransform!;

            if (e.altKey || e.metaKey) {
                let zoom = canvas.getZoom();
                zoom *= 0.999 ** e.deltaY;
                if (zoom > 3) zoom = 3;
                if (zoom < 0.5) zoom = 0.5;

                const point = new fabric.Point(e.offsetX, e.offsetY);
                canvas.zoomToPoint(point, zoom);
            } else {
                vpt[4] -= e.deltaX;
                vpt[5] -= e.deltaY;
                canvas.requestRenderAll();
            }

            e.preventDefault();
            e.stopPropagation();
        };

        canvas.on('mouse:wheel', handleWheel);

        return () => {
            canvas.off('mouse:wheel', handleWheel);
        };
    }, [canvas]);
}
