'use client';

import { Flex } from 'antd';
import Image from 'next/image';
import { useState } from 'react';

// local stores
import { useCanvasStore } from '../_stores';

// local hooks
import { useVoiceRecorder } from '../_hooks';

// local components
import { ReplayButton } from './ReplayButton';

export function FabricToolbar() {
    const isDrawingMode = useCanvasStore((store) => store.isDrawingMode);
    const setDrawingMode = useCanvasStore((store) => store.setDrawingMode);
    const setBrushOptions = useCanvasStore((store) => store.setBrushOptions);
    const hasCanvas = useCanvasStore((store) => !!store.canvasInstance);
    const setEraserMode = useCanvasStore((store) => store.setEraserMode);
    const setStickyMode = useCanvasStore((store) => store.setStickyMode);
    const isMicEnabled = useCanvasStore((store) => store.isMicEnabled);
    const isCamEnabled = useCanvasStore((store) => store.isCamEnabled);
    const toggleMic = useCanvasStore((store) => store.toggleMic);
    const toggleCam = useCanvasStore((store) => store.toggleCam);
    const { isRecordingRef, handleRecord } = useVoiceRecorder({ canvasIdx: 0 });
    const [hoverMic, setHoverMic] = useState(false);
    const [hoverCam, setHoverCam] = useState(false);

    const previewMicEnabled = hoverMic ? !isMicEnabled : isMicEnabled;
    const previewCamEnabled = hoverCam ? !isCamEnabled : isCamEnabled;

    // TODO: 툴바 버튼 컴포넌트 분리 및 스타일링 필요
    return (
        <div className='absolute bottom-[20px] left-1/2 -translate-x-1/2 transform z-[10] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] rounded-full px-4 py-1 flex items-center gap-1'>
            {/* 마이크 */}
            <button
                className='p-2 rounded hover:bg-gray-100'
                onClick={toggleMic}
                onMouseEnter={() => setHoverMic(true)}
                onMouseLeave={() => setHoverMic(false)}
                title={previewMicEnabled ? '마이크 끄기' : '마이크 켜기'}
            >
                <Image
                    src={previewMicEnabled ? '/assets/mic-none.svg' : '/assets/mic-off.svg'}
                    width={20}
                    height={20}
                    alt='mic-toggle'
                />
            </button>

            {/* 카메라 */}
            <button
                className='p-2 rounded hover:bg-gray-100'
                onClick={toggleCam}
                onMouseEnter={() => setHoverCam(true)}
                onMouseLeave={() => setHoverCam(false)}
                title={previewCamEnabled ? '카메라 끄기' : '카메라 켜기'}
            >
                <Image
                    src={previewCamEnabled ? '/assets/videocam.svg' : '/assets/videocam-off.svg'}
                    width={20}
                    height={20}
                    alt='camera-toggle'
                />
            </button>

            <div className='w-px h-6 bg-gray-200' />

            {/* 펜 / 형광펜 / 지우개 */}
            <Flex gap={2} align='center'>
                {/* 선택 */}
                <button
                    className='p-2 rounded hover:bg-gray-100'
                    onClick={() => setDrawingMode(false)}
                >
                    <Image src='/assets/selector.svg' width={20} height={20} alt='selector' />
                </button>
                <button
                    className='p-2 rounded hover:bg-gray-100'
                    onClick={() => {
                        setDrawingMode(true);
                        setBrushOptions({ type: 'pencil', color: '#000000', width: 3 });
                    }}
                >
                    <Image
                        src='/assets/pencel.svg'
                        width={24}
                        height={20}
                        alt='pencil'
                        className='object-contain'
                    />
                </button>
                <button
                    className='p-2 rounded hover:bg-gray-100'
                    onClick={() => {
                        setDrawingMode(true);
                        setBrushOptions({ type: 'highlighter', width: 20 });
                    }}
                >
                    <Image
                        src='/assets/highlighter.svg'
                        width={24}
                        height={20}
                        alt='highlighter'
                        className='object-contain'
                    />
                </button>
                <button
                    className='p-2 rounded hover:bg-gray-100'
                    onClick={() => {
                        setStickyMode(true);
                        setDrawingMode(false);
                        setEraserMode(false);
                    }}
                >
                    <Image
                        src='/assets/sticky.svg'
                        width={30}
                        height={20}
                        alt='sticky'
                        className='object-contain'
                    />
                </button>
                <button
                    className='p-2 rounded hover:bg-gray-100'
                    onClick={() => {
                        setEraserMode(true);
                    }}
                >
                    <Image
                        src='/assets/eraser.svg'
                        width={15}
                        height={20}
                        alt='eraser'
                        className='object-contain'
                    />
                </button>
            </Flex>
        </div>
        // <Flex
        //     className='absolute bottom-[10px] left-1/2 -translate-x-1/2 transform z-[10]'
        //     justify='center'
        //     align='center'
        //     gap={20}
        // >
        //     <Button disabled={!hasCanvas} onClick={() => setDrawingMode(false)}>
        //         선택
        //     </Button>
        //     <Button
        //         disabled={!hasCanvas}
        //         onClick={() => {
        //             setDrawingMode(true);
        //             setBrushOptions({ type: 'pencil', color: '#000000', width: 3 });
        //         }}
        //     >
        //         <Image src='/assets/pencel.svg' width={32} height={71} alt='pencel' />
        //     </Button>
        //     <Button
        //         disabled={!hasCanvas}
        //         onClick={() => {
        //             setDrawingMode(true);
        //             setBrushOptions({ type: 'highlighter', width: 20 });
        //         }}
        //     >
        //         <Image src='/assets/highlighter.svg' width={32} height={71} alt='pencel' />
        //     </Button>
        //     <Button
        //         disabled={!hasCanvas}
        //         onClick={() => {
        //             setStickyMode(true);
        //             setDrawingMode(false);
        //             setEraserMode(false);
        //         }}
        //     >
        //         스티커 메모
        //     </Button>
        //     <Button disabled={!hasCanvas} onClick={() => setEraserMode(true)}>
        //         <Image src='/assets/eraser.svg' width={32} height={71} alt='pencel' />
        //     </Button>
        //     <Button type='default' onClick={handleRecord}>
        //         {isRecordingRef.current ? '녹음 중' : '녹음'}
        //     </Button>
        //     <ReplayButton canvasIdx={0} />
        // </Flex>
    );
}
