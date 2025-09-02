import * as fabric from 'fabric';

// types
import type { DotGridOptions } from '@/types';

export function makeDotPattern({ gap, dot, color, opacity }: DotGridOptions) {
    const tile = document.createElement('canvas');
    const size = gap;
    tile.width = size;
    tile.height = size;

    const ctx = tile.getContext('2d')!;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, dot / 2, 0, Math.PI * 2);
    ctx.fill();

    // Fabric 패턴으로 바로 사용
    return new fabric.Pattern({
        source: tile,
        repeat: 'repeat',
    });
}
