'use client';

import { Flex, Button } from 'antd';

// local stores
import { useCanvasStore } from '../_stores';

export function FabricToolbar() {
    const isDrawingMode = useCanvasStore((s) => s.isDrawingMode);
    const setDrawingMode = useCanvasStore((s) => s.setDrawingMode);
    const hasCanvas = useCanvasStore((s) => !!s.canvasInstance);

    // TODO: 툴바 버튼 컴포넌트 분리 및 스타일링 필요
    return (
        <Flex
            className='absolute bottom-[10px] left-1/2 -translate-x-1/2 transform z-[10]'
            justify='center'
            align='center'
            gap={20}
        >
            <Button
                disabled={!hasCanvas}
                type={!isDrawingMode ? 'primary' : 'default'}
                onClick={() => setDrawingMode(false)}
            >
                선택
            </Button>
            <Button
                disabled={!hasCanvas}
                type={isDrawingMode ? 'primary' : 'default'}
                onClick={() => setDrawingMode(true)}
            >
                펜
            </Button>
        </Flex>
    );
}
