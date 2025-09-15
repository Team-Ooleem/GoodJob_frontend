'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';

// local stores
import { useCanvasStore } from '../_stores';

export function FabricToolbar() {
    const isDrawingMode = useCanvasStore((store) => store.isDrawingMode);
    const setDrawingMode = useCanvasStore((store) => store.setDrawingMode);
    const setBrushOptions = useCanvasStore((store) => store.setBrushOptions);
    const setEraserMode = useCanvasStore((store) => store.setEraserMode);
    const setStickyMode = useCanvasStore((store) => store.setStickyMode);
    const isMicEnabled = useCanvasStore((store) => store.isMicEnabled);
    const isCamEnabled = useCanvasStore((store) => store.isCamEnabled);
    const toggleMic = useCanvasStore((store) => store.toggleMic);
    const toggleCam = useCanvasStore((store) => store.toggleCam);
    const [hoverMic, setHoverMic] = useState(false);
    const [hoverCam, setHoverCam] = useState(false);

    const previewMicEnabled = hoverMic ? !isMicEnabled : isMicEnabled;
    const previewCamEnabled = hoverCam ? !isCamEnabled : isCamEnabled;

    // Figma-like active style for the current selection tool
    const isSelectActive = useMemo(() => !isDrawingMode, [isDrawingMode]);

    return (
        <TooltipProvider>
            <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex justify-center items-center'>
                {/* Figma-like pill container */}
                <div
                    className='
                        flex items-center divide-x divide-black/10
                        rounded-full border border-black/10
                        bg-white/80 supports-[backdrop-filter]:bg-white/60 backdrop-blur
                        shadow-[0_6px_24px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.6)_inset]
                        px-2 py-1
                    '
                >
                    {/* group: media */}
                    <div className='flex items-center gap-1 px-1'>
                        {/* 마이크 */}
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-9 w-9 p-0 rounded-[10px] hover:bg-black/5'
                                    onClick={toggleMic}
                                    onMouseEnter={() => setHoverMic(true)}
                                    onMouseLeave={() => setHoverMic(false)}
                                    aria-label='toggle-mic'
                                >
                                    <Image
                                        src={
                                            previewMicEnabled
                                                ? '/assets/mic-none.svg'
                                                : '/assets/mic-off.svg'
                                        }
                                        width={16}
                                        height={16}
                                        alt='mic-toggle'
                                        className='object-contain'
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{previewMicEnabled ? '마이크 끄기' : '마이크 켜기'}</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 카메라 */}
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-9 w-9 p-0 rounded-[10px] hover:bg-black/5'
                                    onClick={toggleCam}
                                    onMouseEnter={() => setHoverCam(true)}
                                    onMouseLeave={() => setHoverCam(false)}
                                    aria-label='toggle-camera'
                                >
                                    <Image
                                        src={
                                            previewCamEnabled
                                                ? '/assets/videocam.svg'
                                                : '/assets/videocam-off.svg'
                                        }
                                        width={16}
                                        height={16}
                                        alt='camera-toggle'
                                        className='object-contain'
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{previewCamEnabled ? '카메라 끄기' : '카메라 켜기'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* group: drawing tools */}
                    <div className='flex items-center gap-1 px-2'>
                        {/* 선택 도구 */}
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className={`h-9 w-9 p-0 rounded-[10px] hover:bg-black/5 transition-colors ${
                                        isSelectActive
                                            ? 'bg-violet-500 text-white hover:bg-violet-500 shadow-[0_6px_14px_rgba(124,58,237,0.35)]'
                                            : ''
                                    }`}
                                    onClick={() => setDrawingMode(false)}
                                    aria-label='select-tool'
                                >
                                    <Image
                                        src='/assets/selector.svg'
                                        width={16}
                                        height={16}
                                        alt='selector'
                                        className={isSelectActive ? 'invert' : ''}
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>선택 도구</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 펜 */}
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-9 w-9 p-0 rounded-[10px] hover:bg-black/5'
                                    onClick={() => {
                                        setDrawingMode(true);
                                        setBrushOptions({
                                            type: 'pencil',
                                            color: '#000000',
                                            width: 3,
                                        });
                                    }}
                                    aria-label='pencil-tool'
                                >
                                    <Image
                                        src='/assets/pencel.svg'
                                        width={18}
                                        height={16}
                                        alt='pencil'
                                        className='object-contain'
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>펜</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 형광펜 */}
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-9 w-9 p-0 rounded-[10px] hover:bg-black/5'
                                    onClick={() => {
                                        setDrawingMode(true);
                                        setBrushOptions({ type: 'highlighter', width: 20 });
                                    }}
                                    aria-label='highlighter-tool'
                                >
                                    <Image
                                        src='/assets/highlighter.svg'
                                        width={18}
                                        height={16}
                                        alt='highlighter'
                                        className='object-contain'
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>형광펜</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 스티커 노트 */}
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-9 w-9 p-0 rounded-[10px] hover:bg-black/5'
                                    onClick={() => {
                                        setStickyMode(true);
                                        setDrawingMode(false);
                                        setEraserMode(false);
                                    }}
                                    aria-label='sticky-note-tool'
                                >
                                    <Image
                                        src='/assets/sticky.svg'
                                        width={20}
                                        height={16}
                                        alt='sticky'
                                        className='object-contain'
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>스티커 노트</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* 지우개 */}
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-9 w-9 p-0 rounded-[10px] hover:bg-black/5'
                                    onClick={() => {
                                        setEraserMode(true);
                                    }}
                                    aria-label='eraser-tool'
                                >
                                    <Image
                                        src='/assets/eraser.svg'
                                        width={14}
                                        height={16}
                                        alt='eraser'
                                        className='object-contain'
                                    />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>지우개</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* group: plus */}
                    <div className='flex items-center px-1'>
                        <Tooltip>
                            <TooltipTrigger>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-9 w-9 p-0 rounded-[999px] hover:bg-black/5'
                                    aria-label='more-tools'
                                >
                                    <Plus className='h-5 w-5 text-black/80' />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>더 보기</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
