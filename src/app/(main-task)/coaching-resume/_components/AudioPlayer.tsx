'use client';

import { useState, useRef, useEffect } from 'react';

interface SpeakerSegment {
    speakerTag: number;
    textContent: string;
    startTime: number;
    endTime: number;
    audioUrl: string;
}

interface ChatSession {
    sessionId: number;
    segments: SpeakerSegment[];
    timestamp: string;
    mentor_idx: number;
    mentee_idx: number;
    segmentIndex: number;
}

// 오디오 플레이어 컴포넌트
function AudioPlayer({
    playingSegment,
    currentSegment,
    currentSession,
    currentTime,
    duration,
    isPlaying,
    onPlayPause,
    onClose,
}: {
    playingSegment: SpeakerSegment | null;
    currentSegment: SpeakerSegment | null;
    currentSession: ChatSession | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onPlayPause: () => void;
    onClose: () => void;
}) {
    const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragState = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({
        dragging: false,
        offsetX: 0,
        offsetY: 0,
    });

    // 드래그 핸들러
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragState.current.dragging) return;
            const nextX = e.clientX - dragState.current.offsetX;
            const nextY = e.clientY - dragState.current.offsetY;
            const maxX = window.innerWidth - 320;
            const maxY = window.innerHeight - 200;
            setPos({
                x: Math.max(0, Math.min(nextX, maxX)),
                y: Math.max(0, Math.min(nextY, maxY)),
            });
        };

        const onUp = () => {
            dragState.current.dragging = false;
            setIsDragging(false);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []);

    // 시간 포맷 함수
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 게이지바 진행률 계산
    const progressPercentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    if (!playingSegment || !currentSegment || !currentSession) return null;

    return (
        <div
            className='fixed z-[60] transition-all duration-200'
            style={{
                left: pos.x || '50%',
                top: pos.y || 'auto',
                transform: pos.x ? 'none' : 'translateX(-50%)',
                bottom: pos.y ? 'auto' : '1rem',
                opacity: isDragging ? 0.8 : 1,
            }}
        >
            <div className='bg-white border border-gray-200 rounded-xl p-4 shadow-xl w-80 backdrop-blur-sm'>
                {/* 헤더 */}
                <div
                    className='flex items-center justify-between mb-3 cursor-move select-none'
                    onMouseDown={(e) => {
                        const rect = (
                            e.currentTarget.parentElement as HTMLElement
                        ).getBoundingClientRect();
                        dragState.current.dragging = true;
                        setIsDragging(true);
                        dragState.current.offsetX = e.clientX - rect.left;
                        dragState.current.offsetY = e.clientY - rect.top;
                    }}
                >
                    <div className='flex items-center gap-2'>
                        <div
                            className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                        />
                        <div className='text-sm font-semibold text-gray-800'>
                            {currentSegment.speakerTag === 0 ? '멘토' : '멘티'}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100'
                    >
                        ✕
                    </button>
                </div>

                {/* 텍스트 내용 */}
                <div className='text-sm text-gray-700 mb-3 leading-relaxed line-clamp-2'>
                    {currentSegment.textContent}
                </div>

                {/* 컨트롤 */}
                <div className='flex items-center gap-3 mb-3'>
                    <button
                        onClick={onPlayPause}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isPlaying
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                        {isPlaying ? '⏸️ 일시정지' : '▶️ 재생'}
                    </button>
                    <div className='flex-1 text-xs text-gray-500 font-mono'>
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>

                {/* 게이지바 */}
                <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
                    <div
                        className='bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-75 ease-out'
                        style={{
                            width: `${progressPercentage}%`,
                            boxShadow: isPlaying ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none',
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default AudioPlayer;
