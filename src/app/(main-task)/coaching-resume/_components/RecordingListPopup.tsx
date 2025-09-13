'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import { useCanvasStore } from '../_stores/useCanvasStore';
import { useRecordingStore } from '../_stores/useRecordingStore';
import { useAudioPlayer } from '../_hooks/useAudioPlayer';
import { useAudioMetadata } from '../_hooks/useAudioMetadata';
import { useSessionData } from '../_hooks/useSessionData';
import { useDragPosition } from '../_hooks/useDragPosition';
import TranscriptList from './TranscriptList';
import RecordingList from './RecordingList';
import { ChatSession, SpeakerSegment, TranscriptItem } from '@/apis/Recording-api';

export type RecordingItem = {
    id: string;
    title: string;
    durationSec: number;
    createdAt: string;
};

export function RecordingListPopup() {
    // 스토어에서 상태 가져오기
    const isOpen = useCanvasStore((s) => s.isRecordingListOpen);
    const setOpen = useCanvasStore((s) => s.setRecordingListOpen);
    const { selectedRecording, setSelectedRecording, isLoadingAudio, setIsLoadingAudio } =
        useRecordingStore();

    // 커스텀 훅들
    const { pos, handleMouseDown } = useDragPosition();
    const { sessions, loading, error, fetchSessionMessages, loadMore, setSessions } =
        useSessionData('default-canvas-uuid');
    const { loadAudioMetadata } = useAudioMetadata();

    // 오디오 플레이어 훅
    const {
        playingSegment,
        currentSession,
        currentSegment,
        currentTime,
        duration,
        isPlaying,
        isFullSessionMode,
        audioRef,
        playSegment,
        stopAudio,
        handleTimeUpdate,
        handleAudioEnd,
        getAudioSources,
        setCurrentSession,
        setPlayingSegment,
        setCurrentSegment,
        setIsFullSessionMode,
        setIsPlaying,
        setCurrentTime,
        setDuration,
    } = useAudioPlayer();

    // 오디오 로딩 함수 (useAudioLoading 훅 대신 직접 구현)
    const loadAudioWithDuration = useCallback(
        async (audioUrl: string, session: ChatSession) => {
            setIsLoadingAudio(true);
            try {
                const audioDuration = await loadAudioMetadata(audioUrl);
                setDuration(audioDuration);

                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.preload = 'auto';
                    audioRef.current.load();
                }

                return audioDuration;
            } catch (error) {
                console.warn('Failed to load audio metadata:', error);
                const fallbackDuration = Math.max(...session.segments.map((s) => s.endTime));
                setDuration(fallbackDuration);
                return fallbackDuration;
            } finally {
                setIsLoadingAudio(false);
            }
        },
        [loadAudioMetadata, setIsLoadingAudio, setDuration, audioRef],
    );

    // 데이터 로딩
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                try {
                    const sessions = await fetchSessionMessages(1);
                    setSessions(sessions);
                } catch (error) {
                    console.error('Failed to load sessions:', error);
                }
            };
            loadData();
        }
    }, [isOpen, fetchSessionMessages, setSessions]);

    // 세션 로딩 최적화
    useEffect(() => {
        if (selectedRecording && sessions.length > 0) {
            const session = sessions.find((s) => `rec-${s.sessionIdx}` === selectedRecording.id);
            if (session) {
                setCurrentSession(session as unknown as ChatSession);
                setPlayingSegment(session.segments[0]);
                setCurrentSegment(session.segments[0]);
                setIsFullSessionMode(true);
                setCurrentTime(0);

                const audioUrl = session.segments[0]?.audioUrl;
                if (audioUrl) {
                    loadAudioWithDuration(audioUrl, session as unknown as ChatSession);
                }
            }
        }
    }, [
        selectedRecording,
        sessions,
        setCurrentSession,
        setPlayingSegment,
        setCurrentSegment,
        setIsFullSessionMode,
        setCurrentTime,
        loadAudioWithDuration,
    ]);

    const getTotalDuration = (session: ChatSession): number => {
        if (!session.segments || session.segments.length === 0) return 0;

        // audioDuration이 있으면 사용, 없으면 마지막 세그먼트의 endTime 사용
        if (session.audioDuration && session.audioDuration > 0) {
            return session.audioDuration;
        }

        const lastSegment = session.segments[session.segments.length - 1];
        return lastSegment ? lastSegment.endTime : 0;
    };

    const items = useMemo<RecordingItem[]>(() => {
        return sessions.map((session) => ({
            id: `rec-${session.sessionIdx}`,
            title: `음성 메모 ${session.segmentIndex}`,
            durationSec: getTotalDuration(session as ChatSession),
            createdAt: new Date(session.timestamp).toLocaleString(),
        }));
    }, [sessions]);

    const transcripts = useMemo<TranscriptItem[]>(() => {
        if (!selectedRecording) return [];

        const session = sessions.find((s) => `rec-${s.sessionIdx}` === selectedRecording.id);
        if (!session) return [];

        return session.segments.map((seg, idx) => ({
            id: `${selectedRecording.id}-line-${idx + 1}`,
            speaker: seg.speakerTag === 0 ? '멘토' : '멘티',
            timeSec: seg.startTime,
            text: seg.textContent,
            segment: seg,
            session: session as unknown as ChatSession,
        }));
    }, [selectedRecording, sessions]);

    //  핸들러들
    const handleSegmentClick = useCallback(
        (segment: SpeakerSegment, session: ChatSession) => {
            if (isFullSessionMode && audioRef.current) {
                audioRef.current.currentTime = segment.startTime;
                setPlayingSegment(segment);
                setCurrentSegment(segment);
            } else {
                playSegment(segment, session);
            }
        },
        [isFullSessionMode, playSegment, setPlayingSegment, setCurrentSegment],
    );

    const handlePlayPause = useCallback(async () => {
        if (audioRef.current) {
            try {
                if (audioRef.current.paused) {
                    if (duration === 0) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                    await audioRef.current.play();
                    setIsPlaying(true);
                } else {
                    audioRef.current.pause();
                    setIsPlaying(false);
                }
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Audio play/pause error:', error);
                }
            }
        }
    }, [audioRef, duration, setIsPlaying]);

    const handleBack = useCallback(() => {
        setSelectedRecording(null);
        stopAudio();
    }, [setSelectedRecording, stopAudio]);

    const handleClose = useCallback(() => {
        setOpen(false);
        stopAudio();
    }, [setOpen, stopAudio]);

    if (!isOpen) return null;

    return (
        <>
            {/* 숨겨진 오디오 엘리먼트 */}
            {currentSession && (
                <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnd}
                    className='hidden'
                    controls={false}
                    preload='none'
                    muted={false}
                >
                    {getAudioSources(currentSession.segments[0]?.audioUrl || '').map(
                        (source, index) => (
                            <source key={index} src={source.src} type={source.type} />
                        ),
                    )}
                </audio>
            )}

            {/* 메인 팝업 */}
            <div
                className='fixed z-[50]'
                style={{ left: pos.x, top: pos.y }}
                role='dialog'
                aria-modal='false'
                aria-label='녹음 목록'
            >
                <div className='w-[380px] h-[400px] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden flex flex-col'>
                    {/* 헤더 */}
                    <div
                        className='h-10 px-2 flex items-center justify-between bg-slate-50 border-b border-slate-200 cursor-move select-none flex-shrink-0'
                        onMouseDown={handleMouseDown}
                    >
                        <div className='flex items-center gap-1'>
                            {selectedRecording && (
                                <button
                                    aria-label='뒤로'
                                    className='p-1 rounded hover:bg-slate-200 cursor-pointer'
                                    onClick={handleBack}
                                >
                                    <LeftOutlined style={{ fontSize: 14, color: '#334155' }} />
                                </button>
                            )}
                            <span className='text-sm font-medium text-slate-700'>
                                {selectedRecording
                                    ? `${selectedRecording.title} • STT 타임라인`
                                    : '녹음 목록'}
                            </span>
                            {isLoadingAudio && (
                                <div className='ml-2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
                            )}
                        </div>
                        <button
                            aria-label='닫기'
                            className='p-1 rounded hover:bg-slate-200'
                            onClick={handleClose}
                        >
                            <CloseOutlined style={{ fontSize: 14, color: '#334155' }} />
                        </button>
                    </div>

                    {/* 콘텐츠 영역 */}
                    <div className='flex-1 overflow-hidden flex flex-col min-h-0'>
                        {selectedRecording ? (
                            <TranscriptList
                                transcripts={transcripts}
                                playingSegment={playingSegment}
                                onPlaySegment={handleSegmentClick}
                                isFullSessionMode={isFullSessionMode}
                                audioRef={audioRef}
                                currentSegment={currentSegment}
                                currentSession={currentSession as ChatSession}
                                currentTime={currentTime}
                                duration={duration}
                                isPlaying={isPlaying}
                                onPlayPause={handlePlayPause}
                                onClose={stopAudio}
                            />
                        ) : (
                            <RecordingList
                                items={items}
                                loading={loading}
                                onRecordingClick={() => {}}
                                onSelectItem={setSelectedRecording}
                                onLoadMore={loadMore}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
