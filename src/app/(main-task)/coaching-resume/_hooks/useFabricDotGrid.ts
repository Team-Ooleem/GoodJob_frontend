'use client';

import { useEffect } from 'react';
import * as fabric from 'fabric';

// global types
import type { DotGridOptions } from '@/types';

// global utils
import { makeDotPattern } from '@/utils';

export function useFabricDotGrid(canvas: fabric.Canvas | null, options: DotGridOptions) {
    useEffect(() => {
        if (!canvas) return;

        const pattern = makeDotPattern(options);
        canvas.backgroundColor = pattern;
        canvas.requestRenderAll();

        return () => {
            // 배경 제거
            canvas.backgroundColor = '';
            canvas.requestRenderAll();
        };
    }, [canvas, options.gap, options.dot, options.color, options.opacity]);
}
