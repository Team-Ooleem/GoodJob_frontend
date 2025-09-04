'use client';

import { Flex, Button } from 'antd';

// local stores
import { useCanvasStore } from '../_stores';

export function FabricToolbar() {
    const isDrawingMode = useCanvasStore((store) => store.isDrawingMode);
    const setDrawingMode = useCanvasStore((store) => store.setDrawingMode);
    const setBrushOptions = useCanvasStore((store) => store.setBrushOptions);
    const hasCanvas = useCanvasStore((store) => !!store.canvasInstance);

    // TODO: 툴바 버튼 컴포넌트 분리 및 스타일링 필요
    return (
        <Flex
            className='absolute bottom-[10px] left-1/2 -translate-x-1/2 transform z-[10]'
            justify='center'
            align='center'
            gap={20}
        >
            <Button disabled={!hasCanvas} onClick={() => setDrawingMode(false)}>
                선택
            </Button>
            <Button
                disabled={!hasCanvas}
                onClick={() => {
                    setDrawingMode(true);
                    setBrushOptions({ type: 'pencil', color: '#000000', width: 3 });
                }}
            >
                펜
            </Button>
            <Button
                disabled={!hasCanvas}
                onClick={() => {
                    setDrawingMode(true);
                    setBrushOptions({ type: 'highlighter', width: 20 });
                }}
            >
                형광펜
            </Button>
        </Flex>
    );
}
