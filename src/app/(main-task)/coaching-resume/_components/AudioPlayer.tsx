'use client';

import { useState, useRef, useEffect } from 'react';
import { SpeakerSegment, ChatSession } from '@/apis/Recording-api';

// 미니멀 다크 테마 오디오 플레이어 컴포넌트
function AudioPlayer({
    playingSegment,
    currentSegment,
    currentSession,
    currentTime,
    duration,
    isPlaying,
    onPlayPause,
    onClose,
    audioRef, // 추가
}: {
    playingSegment: SpeakerSegment | null;
    currentSegment: SpeakerSegment | null;
    currentSession: ChatSession | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onPlayPause: () => void;
    onClose: () => void;
    audioRef?: React.RefObject<HTMLAudioElement>; // 추가
}) {
    // 시간 포맷 함수
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 게이지바 진행률 계산
    const progressPercentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
        <div className='relative'>
            {/* 하늘색 블러 게이지바 - 2단계 굵기와 강화된 블러 효과 */}
            <div className='w-full bg-gray-800 h-2 relative overflow-hidden'>
                {/* 강화된 블러 배경 - 다층 효과 */}
                <div className='absolute inset-0 bg-gradient-to-r from-sky-300 via-sky-400 to-sky-500 blur-md opacity-40' />
                <div className='absolute inset-0 bg-gradient-to-r from-sky-400 to-sky-500 blur-sm opacity-60' />

                {/* 메인 진행 바 - 그라데이션과 글로우 효과 */}
                <div
                    className='relative h-full transition-all duration-200 ease-out'
                    style={{ width: `${progressPercentage}%` }}
                >
                    {/* 내부 그라데이션 */}
                    <div className='absolute inset-0 bg-gradient-to-r from-sky-300 via-sky-400 to-sky-500' />

                    {/* 글로우 효과 */}
                    <div className='absolute inset-0 bg-gradient-to-r from-sky-200 to-sky-400 blur-sm opacity-70' />

                    {/* 상단 하이라이트 */}
                    <div className='absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-r from-sky-100 to-sky-300 opacity-50' />
                </div>

                {/* 진행 바 끝부분 글로우 효과 */}
                {progressPercentage > 0 && (
                    <div
                        className='absolute top-0 w-1 h-full bg-white opacity-80 blur-sm'
                        style={{ left: `${progressPercentage}%` }}
                    />
                )}
            </div>

            {/* 오디오 플레이어 본체 - 패딩 최소화 */}
            <div className='bg-black px-2 py-1'>
                {/* 상단 시간 표시 */}
                <div className='flex justify-between items-center mb-1'>
                    <span className='text-gray-300 text-xs font-mono'>
                        {formatTime(currentTime)}
                    </span>
                    <span className='text-gray-300 text-xs font-mono'>{formatTime(duration)}</span>
                </div>

                {/* 컨트롤 버튼들 */}
                <div className='flex items-center justify-center gap-2'>
                    {/* 재생 속도 */}
                    <div className='text-white font-bold text-xs'>1x</div>

                    {/* 되감기 버튼 */}
                    <button
                        onClick={() => {
                            // 5초 되감기 로직
                            if (currentSegment && audioRef?.current) {
                                audioRef.current.currentTime = Math.max(
                                    0,
                                    audioRef.current.currentTime - 5,
                                );
                            }
                        }}
                        disabled={!currentSegment}
                        className='w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <svg width='6' height='6' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z' />
                        </svg>
                        <span className='text-xs ml-0.5'>5</span>
                    </button>

                    {/* 재생/일시정지 버튼 */}
                    <button
                        onClick={onPlayPause}
                        disabled={!currentSegment}
                        className='w-6 h-6 rounded-full bg-white flex items-center justify-center text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {isPlaying ? (
                            <svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor'>
                                <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
                            </svg>
                        ) : (
                            <svg width='10' height='10' viewBox='0 0 24 24' fill='currentColor'>
                                <path d='M8 5v14l11-7z' />
                            </svg>
                        )}
                    </button>

                    {/* 빨리 감기 버튼 */}
                    <button
                        onClick={() => {
                            // 5초 빨리 감기 로직
                            if (currentSegment && audioRef?.current) {
                                audioRef.current.currentTime = Math.min(
                                    duration,
                                    audioRef.current.currentTime + 5,
                                );
                            }
                        }}
                        disabled={!currentSegment}
                        className='w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        <svg width='6' height='6' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z' />
                        </svg>
                        <span className='text-xs ml-0.5'>5</span>
                    </button>

                    {/* 메뉴 아이콘 */}
                    <button className='w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-800'>
                        <svg width='8' height='8' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z' />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AudioPlayer;
