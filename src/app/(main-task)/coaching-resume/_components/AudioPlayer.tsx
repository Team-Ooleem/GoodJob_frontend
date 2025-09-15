'use client';

import React, { useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, List, Volume2, Settings } from 'lucide-react';
import { SpeakerSegment, ChatSession } from '@/apis/recoding-api';
import { RecordingListPopup } from './RecordingListPopup';
import { useCanvasStore } from '../_stores/useCanvasStore';
import { useAudioPlayer } from '../_hooks/useAudioPlayer';
import { useSessionData } from '../_hooks/useSessionData';

function AudioPlayer() {
    const progressRef = useRef<HTMLDivElement>(null);

    // Canvas Store에서 팝업 상태 관리
    const setRecordingListOpen = useCanvasStore((s) => s.setRecordingListOpen);

    // 오디오 플레이어 훅 (Zustand 스토어 사용)
    const {
        currentSession,
        currentSegment,
        currentTime,
        duration,
        isPlaying,
        isReady,
        audioRef,
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

    // 세션 데이터 로드
    const { sessions, fetchSessionMessages } = useSessionData('resume-room');

    // 초기 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                const sessionData = await fetchSessionMessages(1);
                if (sessionData.length > 0 && !currentSession) {
                    setCurrentSession(sessionData[0]);
                }
            } catch (error) {
                console.error('Failed to load session data:', error);
            }
        };
        loadData();
    }, [fetchSessionMessages, setCurrentSession, currentSession]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 세그먼트 클릭으로 해당 시간으로 이동하여 재생
    const handleSegmentClick = (segment: SpeakerSegment, session?: ChatSession) => {
        if (!session || !audioRef.current) return;

        // 해당 세그먼트의 startTime으로 이동
        audioRef.current.currentTime = segment.startTime;

        // 현재 세그먼트 설정
        setCurrentSegment(segment);
        setPlayingSegment(segment);

        // 자동 재생
        audioRef.current
            .play()
            .then(() => {
                // 재생 성공 시 상태 업데이트는 handleTimeUpdate에서 처리
            })
            .catch((error) => {
                console.error('Audio play error:', error);
            });
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

    const progressPercentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
        <div className='w-full max-w-4xl mx-auto'>
            {/* 메인 컨테이너 */}
            <div className='bg-slate-950/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800/50 overflow-hidden'>
                {/* 헤더 */}
                <div className='px-6 pt-6 pb-4 border-b border-slate-800/30 flex items-center justify-between'>
                    <div className='text-white font-medium'>
                        {currentSession ? `세션 ${currentSession.sessionIdx}` : '오디오 플레이어'}
                    </div>
                    <div className='flex items-center space-x-4'>
                        <div
                            className={`text-sm ${isReady ? 'text-green-400' : 'text-yellow-400'}`}
                        >
                            {isReady ? '준비됨' : '로딩 중...'}
                        </div>
                        <button
                            onClick={() => setRecordingListOpen(true)}
                            className='p-2 rounded-full bg-slate-800/60 hover:bg-slate-700/80 transition-all duration-200'
                        >
                            <List className='w-4 h-4 text-slate-300' />
                        </button>
                    </div>
                </div>

                {/* 컨트롤 영역 */}
                <div className='p-6'>
                    <div className='flex items-center space-x-6'>
                        {/* 현재 시간 */}
                        <div className='text-slate-300 text-sm font-mono tabular-nums min-w-[45px]'>
                            {formatTime(currentTime)}
                        </div>

                        {/* 컨트롤 버튼들 */}
                        <div className='flex items-center space-x-4'>
                            {/* 10초 뒤로 */}
                            <button
                                onClick={() => skipTime(-10)}
                                disabled={!isReady}
                                className='w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/60 hover:bg-slate-700/80 transition-all duration-200 backdrop-blur-sm border border-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <RotateCcw className='w-4 h-4 text-slate-300' />
                            </button>

                            {/* 재생/정지 */}
                            <button
                                onClick={togglePlayPause}
                                disabled={!isReady}
                                className='w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 hover:from-white hover:to-slate-100 transition-all duration-200 shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {isPlaying ? (
                                    <Pause className='w-5 h-5 text-slate-900' fill='currentColor' />
                                ) : (
                                    <Play
                                        className='w-5 h-5 text-slate-900 ml-0.5'
                                        fill='currentColor'
                                    />
                                )}
                            </button>

                            {/* 10초 앞으로 */}
                            <button
                                onClick={() => skipTime(10)}
                                disabled={!isReady}
                                className='w-10 h-10 flex items-center justify-center rounded-full bg-slate-800/60 hover:bg-slate-700/80 transition-all duration-200 backdrop-blur-sm border border-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <RotateCw className='w-4 h-4 text-slate-300' />
                            </button>
                        </div>

                        {/* 진행률 바 */}
                        <div className='flex-1 mx-6 relative'>
                            <div
                                ref={progressRef}
                                className='relative w-full h-2 bg-slate-800/50 rounded-full cursor-pointer group overflow-hidden backdrop-blur-sm'
                                onClick={handleProgressClick}
                            >
                                {/* STT 세그먼트 마커들 */}
                                {currentSession?.segments.map((segment, index) => {
                                    const startPercentage = (segment.startTime / duration) * 100;
                                    const endPercentage = (segment.endTime / duration) * 100;
                                    const isCurrentSegment =
                                        currentSegment?.startTime === segment.startTime;

                                    return (
                                        <div
                                            key={index}
                                            className={`absolute top-0 h-full cursor-pointer transition-all rounded-sm z-10 ${
                                                isCurrentSegment
                                                    ? 'bg-yellow-400/50 border border-yellow-400/80 shadow-lg shadow-yellow-400/20'
                                                    : segment.speakerTag === 1
                                                      ? 'bg-blue-300/30 hover:bg-blue-300/50 border border-blue-400/40'
                                                      : 'bg-green-300/30 hover:bg-green-300/50 border border-green-400/40'
                                            }`}
                                            style={{
                                                left: `${startPercentage}%`,
                                                width: `${Math.max(0.5, endPercentage - startPercentage)}%`,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSegmentClick(segment, currentSession);
                                            }}
                                            title={`${segment.speakerTag === 1 ? '멘토' : '멘티'}: ${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`}
                                        />
                                    );
                                })}

                                {/* 진행률 바 */}
                                <div
                                    className='absolute top-0 left-0 h-full bg-gradient-to-r from-white via-white to-gray-100 rounded-full transition-all duration-300 shadow-lg z-20'
                                    style={{ width: `${progressPercentage}%` }}
                                >
                                    <div className='absolute inset-0 bg-white rounded-full blur-sm opacity-40'></div>
                                </div>

                                {/* 호버 핸들 */}
                                <div
                                    className='absolute top-1/2 w-4 h-4 bg-white rounded-full transform -translate-y-1/2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-2 border-gray-200 z-30'
                                    style={{ left: `calc(${progressPercentage}% - 8px)` }}
                                >
                                    <div className='absolute inset-0 bg-white rounded-full blur-sm opacity-60'></div>
                                </div>
                            </div>
                        </div>

                        {/* 전체 시간 */}
                        <div className='text-slate-400 text-sm font-mono tabular-nums min-w-[45px]'>
                            {formatTime(duration)}
                        </div>

                        {/* 볼륨 컨트롤 */}
                        <div className='flex items-center space-x-2'>
                            <Volume2 className='w-4 h-4 text-slate-300' />
                            <input
                                type='range'
                                min='0'
                                max='1'
                                step='0.1'
                                value={volume}
                                onChange={handleVolumeChange}
                                className='w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer'
                            />
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
