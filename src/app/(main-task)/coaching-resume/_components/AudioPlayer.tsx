'use client';

import { SpeakerSegment, ChatSession } from '@/apis/recoding-api';
import { useState, useRef, useEffect } from 'react';

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
    audioRef,
}: {
    playingSegment: SpeakerSegment | null;
    currentSegment: SpeakerSegment | null;
    currentSession: ChatSession | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onPlayPause: () => void;
    onClose: () => void;
    audioRef?: React.RefObject<HTMLAudioElement>;
}) {
    // ✅ 드래그 상태 관리
    const [isDragging, setIsDragging] = useState(false);
    const [dragTime, setDragTime] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);

    // 시간 포맷 함수 (소숫점 제거)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 게이지바 진행률 계산
    const displayTime = isDragging ? dragTime : currentTime;
    const progressPercentage = duration > 0 ? Math.min(100, (displayTime / duration) * 100) : 0;

    // ✅ 개선된 시간 이동 함수
    const moveTime = (seconds: number) => {
        if (!audioRef?.current) return;

        const currentAudioTime = audioRef.current.currentTime;
        let newTime = currentAudioTime + seconds;

        // ✅ 세그먼트 경계 체크
        if (currentSegment) {
            newTime = Math.max(currentSegment.startTime, Math.min(currentSegment.endTime, newTime));
        } else {
            newTime = Math.max(0, Math.min(duration, newTime));
        }

        audioRef.current.currentTime = newTime;
    };

    // ✅ 마우스/터치 이벤트로 시간 계산
    const getTimeFromEvent = (
        event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    ) => {
        if (!progressRef.current || duration === 0) return 0;

        const rect = progressRef.current.getBoundingClientRect();
        let clientX: number;

        if ('touches' in event) {
            clientX = event.touches[0].clientX;
        } else {
            clientX = event.clientX;
        }

        const clickX = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        return percentage * duration;
    };

    // ✅ 진행바 클릭으로 시간 이동
    const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef?.current || duration === 0) return;

        const newTime = getTimeFromEvent(event);
        audioRef.current.currentTime = newTime;
    };

    // ✅ 드래그 시작
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        if (duration === 0) return;

        setIsDragging(true);
        const newTime = getTimeFromEvent(event);
        setDragTime(newTime);

        event.preventDefault();
    };

    // ✅ 드래그 중
    const handleMouseMove = (event: MouseEvent) => {
        if (!isDragging || !progressRef.current || duration === 0) return;

        const rect = progressRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = percentage * duration;

        setDragTime(newTime);
    };

    // ✅ 드래그 종료
    const handleMouseUp = () => {
        if (!isDragging) return;

        setIsDragging(false);
        if (audioRef?.current) {
            audioRef.current.currentTime = dragTime;
        }
    };

    // ✅ 터치 이벤트 지원
    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (duration === 0) return;

        setIsDragging(true);
        const newTime = getTimeFromEvent(event);
        setDragTime(newTime);
    };

    const handleTouchMove = (event: TouchEvent) => {
        if (!isDragging || !progressRef.current || duration === 0) return;

        const rect = progressRef.current.getBoundingClientRect();
        const clickX = event.touches[0].clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = percentage * duration;

        setDragTime(newTime);
    };

    // ✅ 전역 이벤트 리스너 등록
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, dragTime]);

    return (
        <div className='relative'>
            {/* ✅ 드래그 가능한 진행바 */}
            <div
                ref={progressRef}
                className='w-full bg-gray-800 h-2 relative overflow-hidden cursor-pointer select-none'
                onClick={handleProgressClick}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
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

                {/* ✅ 드래그 핸들 */}
                <div
                    className='absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/2 cursor-grab active:cursor-grabbing'
                    style={{
                        left: `${progressPercentage}%`,
                        marginLeft: '-8px',
                    }}
                />

                {/* 진행 바 끝부분 글로우 효과 */}
                {progressPercentage > 0 && (
                    <div
                        className='absolute top-0 w-1 h-full bg-white opacity-80 blur-sm'
                        style={{ left: `${progressPercentage}%` }}
                    />
                )}
            </div>

            {/* 오디오 플레이어 본체 */}
            <div className='bg-black px-2 py-1'>
                {/* 상단 시간 표시 */}
                <div className='flex justify-between items-center mb-1'>
                    <span className='text-gray-300 text-xs font-mono'>
                        {formatTime(displayTime)}
                    </span>
                    <span className='text-gray-300 text-xs font-mono'>{formatTime(duration)}</span>
                </div>

                {/* 컨트롤 버튼들 */}
                <div className='flex items-center justify-center gap-2'>
                    {/* 재생 속도 표시 */}
                    <div className='text-white font-bold text-xs'>1x</div>

                    {/* ✅ 5초 되감기 버튼 */}
                    <button
                        onClick={() => moveTime(-5)}
                        disabled={!audioRef?.current}
                        className='w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        title='5초 뒤로'
                    >
                        <svg width='8' height='8' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z' />
                        </svg>
                        <span className='text-xs ml-0.5'>5</span>
                    </button>

                    {/* ✅ 재생/일시정지 버튼 */}
                    <button
                        onClick={onPlayPause}
                        disabled={!audioRef?.current}
                        className='w-6 h-6 rounded-full bg-white flex items-center justify-center text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        title={isPlaying ? '일시정지' : '재생'}
                    >
                        {isPlaying ? (
                            <svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor'>
                                <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
                            </svg>
                        ) : (
                            <svg width='12' height='12' viewBox='0 0 24 24' fill='currentColor'>
                                <path d='M8 5v14l11-7z' />
                            </svg>
                        )}
                    </button>

                    {/* ✅ 5초 빨리 감기 버튼 */}
                    <button
                        onClick={() => moveTime(5)}
                        disabled={!audioRef?.current}
                        className='w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        title='5초 앞으로'
                    >
                        <svg width='8' height='8' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M13 6v12l8.5-6L13 6zM4 18l8.5-6L4 6v12z' />
                        </svg>
                        <span className='text-xs ml-0.5'>5</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AudioPlayer;
