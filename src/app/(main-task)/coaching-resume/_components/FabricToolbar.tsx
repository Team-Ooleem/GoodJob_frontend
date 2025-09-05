'use client';

import { Flex, Button } from 'antd';

// local stores
import { useCanvasStore } from '../_stores';

// local hooks
import { useVoiceRecorder } from '../_hooks';

// local components
import { ReplayButton } from './ReplayButton';

export function FabricToolbar() {
    const isDrawingMode = useCanvasStore((store) => store.isDrawingMode);
    const setDrawingMode = useCanvasStore((store) => store.setDrawingMode);
    const hasCanvas = useCanvasStore((store) => !!store.canvasInstance);
    const { isRecordingRef, handleRecord } = useVoiceRecorder({ canvasIdx: 0 });

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
            <Button type='default' onClick={handleRecord}>
                {isRecordingRef.current ? '녹음 중' : '녹음'}
            </Button>
            <ReplayButton canvasIdx={0} />
        </Flex>
    );
}
