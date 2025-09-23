'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw, List, Volume2 } from 'lucide-react';
import { SpeakerSegment, ChatSession } from '@/apis/recoding-api';
import { RecordingListPopup } from './RecordingListPopup';
import { useCanvasStore } from '../_stores/useCanvasStore';
import { useAudioPlayer } from '../_hooks/useAudioPlayer';
import { useSessionData } from '../_hooks/useSessionData';
import { useAudioStore } from '../_stores/useAudioStore';
import { useParams } from 'next/navigation';
function AudioPlayer() {
    const params = useParams();
    const canvasUuid = params.sessionId as string; // URL에서 sessionId 가져오기
    const progressRef = useRef<HTMLDivElement>(null);
    const hasLoadedRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    // 🎯 60fps를 위한 부드러운 진행률 상태
    const [smoothProgress, setSmoothProgress] = useState(0);
    const toggleRecordingList = useCanvasStore((s) => s.toggleRecordingList);

    // 드래그 상태 관리
    const [isDragging, setIsDragging] = useState(false);

    // 핸들 드래그 시작
    const handleHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation(); // 진행률 바 클릭 이벤트 방지
        setIsDragging(true);
    };

    // 🆕 드래그 중
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !progressRef.current || duration === 0) return;
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * duration;
        seekTo(newTime);
    };

    // 드래그 종료
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 🆕 마우스가 영역을 벗어날 때 드래그 종료
    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Canvas Store에서 팝업 상태 관리
    const setRecordingListOpen = useCanvasStore((s) => s.setRecordingListOpen);

    // 🎯 메인 오디오 플레이어 훅 (모든 오디오 기능 담당)
    const {
        currentSession,
        currentSegment,
        currentTime,
        duration,
        isPlaying,
        isReady,
        audioRef,
        seekToTime,
        setSeekToTime,
        togglePlayPause,
        handleTimeUpdate,
        handleAudioEnd,
        handleLoadedMetadata,
        getAudioSources,
        seekTo,
        setCurrentSession,
        setCurrentSegment,
        setPlayingSegment,
        volume,
        setVolume,
        recentSessions,
    } = useAudioPlayer();

    // 🎯 60fps 부드러운 애니메이션을 위한 requestAnimationFrame
    const updateProgress = useCallback(() => {
        if (audioRef.current && duration > 0) {
            const progress = (audioRef.current.currentTime / duration) * 100;
            setSmoothProgress(Math.min(100, progress));
        }
        animationFrameRef.current = requestAnimationFrame(updateProgress);
    }, [duration]);

    // 🎯 재생 상태에 따라 애니메이션 시작/중지
    useEffect(() => {
        if (isPlaying && isReady) {
            animationFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, isReady, updateProgress]);

    // 🎯 seekToTime 변경 감지하여 seekTo 호출
    useEffect(() => {
        if (seekToTime !== null) {
            seekTo(seekToTime);
            setSeekToTime(null);

            // 자동 재생 시작
            setTimeout(() => {
                if (!isPlaying) {
                    togglePlayPause();
                }
            }, 100);
        }
    }, [seekToTime, seekTo, setSeekToTime, isPlaying, togglePlayPause]);

    // 🎯 메인 세션 데이터 로딩 (중복 제거)
    const { sessions, fetchSessionMessages } = useSessionData(canvasUuid);

    // 초기 데이터 로드 및 recentSessions 동기화 (한 번만 실행)
    useEffect(() => {
        if (hasLoadedRef.current) return;

        const loadData = async () => {
            try {
                const sessionData = await fetchSessionMessages(1);
                if (sessionData.length > 0) {
                    if (!currentSession) {
                        setCurrentSession(sessionData[0]);
                    }

                    const { addToRecentSessions } = useAudioStore.getState();
                    sessionData.forEach((session) => {
                        addToRecentSessions(session);
                    });

                    hasLoadedRef.current = true;
                }
            } catch (error) {
                console.error('Failed to load session data:', error);
            }
        };

        loadData();
    }, [fetchSessionMessages, setCurrentSession, currentSession]);

    // currentSession 변경 시 오디오 URL 로딩
    useEffect(() => {
        if (currentSession && audioRef.current) {
            const audioElement = audioRef.current;
            const audioSources = getAudioSources(currentSession.audioUrl || '');

            if (audioSources.length > 0) {
                // 새로운 세션 로드 시 즉시 진행률 0으로 초기화
                setSmoothProgress(0);

                audioElement.src = audioSources[0].src;
                audioElement.preload = 'metadata';
                audioElement.load();
            }
        } else if (!currentSession) {
            // 세션이 없을 때도 진행률 0으로 초기화
            setSmoothProgress(0);
        }
    }, [currentSession, getAudioSources]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 10초 앞으로/뒤로 이동
    const skipTime = (seconds: number) => {
        seekTo(currentTime + seconds);
    };

    // 진행바 클릭으로 시간 이동
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || duration === 0) return;
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * duration;
        seekTo(newTime);
    };

    // 볼륨 조절
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    // 🎯 60fps 부드러운 진행률 사용
    const progressPercentage = smoothProgress;

    return (
        <div className='w-full max-w-4xl absolute bottom-10 left-1/2 -translate-x-1/2'>
            {/* 🎯 shadcn/ui 디자인 토큰 적용 */}
            <div className='bg-card border rounded-lg shadow-sm overflow-hidden'>
                {/* 컨트롤 영역 */}
                <div className='p-6'>
                    <div className='flex items-center space-x-6'>
                        {/* 현재 시간 */}
                        <div className='text-muted-foreground text-sm font-mono tabular-nums min-w-[30px]'>
                            {formatTime(currentTime)}
                        </div>

                        {/* 컨트롤 버튼들 */}
                        <div className='flex items-center space-x-4'>
                            {/* 10초 뒤로 */}
                            <button
                                onClick={() => skipTime(-10)}
                                disabled={!isReady}
                                className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10'
                            >
                                <RotateCcw className='h-4 w-4' />
                            </button>

                            {/* 재생/정지 */}
                            <button
                                onClick={togglePlayPause}
                                disabled={!isReady}
                                className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12'
                            >
                                {isPlaying ? (
                                    <Pause className='h-5 w-5' />
                                ) : (
                                    <Play className='h-5 w-5 ml-0.5' />
                                )}
                            </button>

                            {/* 10초 앞으로 */}
                            <button
                                onClick={() => skipTime(10)}
                                disabled={!isReady}
                                className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10'
                            >
                                <RotateCw className='h-4 w-4' />
                            </button>
                        </div>

                        {/* 진행률 바 */}
                        <div className='flex-1 mx-6 relative'>
                            <div
                                ref={progressRef}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseLeave}
                                className='relative w-full h-2 bg-secondary rounded-full cursor-pointer group overflow-hidden'
                                onClick={handleProgressClick}
                            >
                                {/* STT 세그먼트 마커들 */}
                                {currentSession?.segments.map((segment, index) => {
                                    const startPercentage = (segment.startTime / duration) * 100;
                                    const endPercentage = (segment.endTime / duration) * 100;

                                    // 🎯 audioRef에서 직접 현재 시간 가져오기 (상태 지연 문제 해결)
                                    const actualCurrentTime =
                                        audioRef.current?.currentTime || currentTime;

                                    // 🎯 게이지 위치에 따라 현재 세그먼트 판단 (통합된 로직)
                                    const isCurrentSegment =
                                        actualCurrentTime >= segment.startTime &&
                                        actualCurrentTime <= segment.endTime;

                                    return (
                                        <div
                                            key={index}
                                            className={`absolute top-0 h-full cursor-pointer transition-all rounded-sm z-10 ${
                                                isCurrentSegment
                                                    ? 'bg-primary/50 border border-primary shadow-lg shadow-primary/20'
                                                    : segment.speakerTag === 1
                                                      ? 'bg-blue-500/30 hover:bg-blue-500/50 border border-blue-500/40'
                                                      : 'bg-green-500/30 hover:bg-green-500/50 border border-green-500/40'
                                            }`}
                                            style={{
                                                left: `${startPercentage}%`,
                                                width: `${Math.max(0.5, endPercentage - startPercentage)}%`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // 🎯 마커 내에서 클릭한 정확한 위치 계산
                                                const rect =
                                                    e.currentTarget.getBoundingClientRect();
                                                const clickX = e.clientX - rect.left;
                                                const markerWidth = rect.width;
                                                const clickRatio = clickX / markerWidth;

                                                // 🎯 클릭한 위치에 해당하는 정확한 시간 계산
                                                const segmentDuration =
                                                    segment.endTime - segment.startTime;
                                                const clickedTime =
                                                    segment.startTime +
                                                    segmentDuration * clickRatio;

                                                seekTo(clickedTime);
                                            }}
                                            title={`${segment.speakerTag === 1 ? '멘토' : '멘티'}: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`}
                                        />
                                    );
                                })}

                                {/* 진행률 바 - 60fps 부드러운 애니메이션 */}
                                <div
                                    className='absolute top-0 left-0 h-full bg-primary rounded-full shadow-sm z-20'
                                    style={{
                                        width: `${progressPercentage}%`,
                                    }}
                                >
                                    <div className='absolute inset-0 bg-primary/40 rounded-full blur-sm'></div>
                                </div>

                                {/* 호버 핸들 - 60fps 부드러운 애니메이션 */}
                                <div
                                    className={`absolute top-1/2 w-4 h-4 bg-primary rounded-full transform -translate-y-1/2 shadow-lg border-2 border-background z-30 transition-opacity duration-200 ${
                                        isDragging
                                            ? 'opacity-100'
                                            : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                    style={{
                                        left: `calc(${progressPercentage}% - 8px)`,
                                    }}
                                    onMouseDown={handleHandleMouseDown}
                                >
                                    <div className='absolute inset-0 bg-primary/60 rounded-full blur-sm'></div>
                                </div>
                            </div>
                        </div>

                        {/* 전체 시간 */}
                        <div className='text-muted-foreground text-sm font-mono tabular-nums min-w-[45px]'>
                            {formatTime(duration)}
                        </div>

                        {/* 볼륨 컨트롤 */}
                        <div className='flex items-center space-x-2'>
                            <Volume2 className='h-4 w-4 text-primary' />
                            <input
                                type='range'
                                min='0'
                                max='1'
                                step='0.1'
                                value={volume}
                                onChange={handleVolumeChange}
                                className='w-16 h-1 bg-secondary rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:appearance-none'
                                style={{
                                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${volume * 100}%, hsl(var(--secondary)) ${volume * 100}%, hsl(var(--secondary)) 100%)`,
                                }}
                            />
                        </div>

                        {/* 녹음 목록 버튼 */}
                        <div className='flex items-center space-x-4'>
                            <button
                                onClick={toggleRecordingList} // setRecordingListOpen(true) 대신
                                className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10'
                            >
                                <List className='h-4 w-4' />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 숨겨진 오디오 엘리먼트 - 전체 세션 오디오만 사용 */}
            {currentSession && (
                <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnd}
                    onLoadedMetadata={handleLoadedMetadata}
                    style={{ display: 'none' }}
                >
                    {getAudioSources(currentSession.audioUrl || '').map((source, index) => (
                        <source key={index} src={source.src} type={source.type} />
                    ))}
                </audio>
            )}

            {/* RecordingListPopup 컴포넌트 사용 */}
            <RecordingListPopup />
        </div>
    );
}

export default AudioPlayer;
