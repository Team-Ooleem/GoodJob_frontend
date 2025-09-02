'use client';

import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

type FabricCanvasProps = {
    width: number;
    height: number;
};

export const useFabricCanvas = ({ width, height }: FabricCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const newCanvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
        });

        setCanvas(newCanvas);

        return () => {
            newCanvas.dispose();
        };
    }, [width, height]);

    return { canvasRef, canvas };
};
