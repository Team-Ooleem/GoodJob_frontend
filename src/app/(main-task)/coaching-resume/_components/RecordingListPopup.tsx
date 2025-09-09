'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useCanvasStore } from '../_stores/useCanvasStore';
import { useAudioPlayer } from '../_hooks/useAudioPlayer';
import AudioPlayer from '../_components/AudioPlayer';
import TranscriptList from '../_components/TranscriptList';
import RecordingList from './RecordingList';
import { API_BASE_URL } from '@/constants/config';

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

type RecordingItem = {
    id: string;
    title: string;
    durationSec: number;
    createdAt: string;
};

type TranscriptItem = {
    id: string;
    speaker: '멘토' | '멘티';
    timeSec: number;
    text: string;
    segment: SpeakerSegment;
    session: ChatSession;
};

export function RecordingListPopup() {
    const isOpen = useCanvasStore((s) => s.isRecordingListOpen);
    const setOpen = useCanvasStore((s) => s.setRecordingListOpen);

    const [pos, setPos] = useState<{ x: number; y: number }>({ x: 40, y: 100 });
    const dragState = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({
        dragging: false,
        offsetX: 0,
        offsetY: 0,
    });

    // 오디오 플레이어 훅 사용
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
        playFullSession,
        stopAudio,
        handleTimeUpdate,
        handleAudioEnd,
        getAudioSources,
    } = useAudioPlayer();

    // 데이터 관련 상태
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<RecordingItem | null>(null);
    const [page, setPage] = useState(1);

    const canvasIdx = 'default-canvas-uuid';

    // 백엔드에서 세션 데이터 가져오기 (axios 처리)
    const fetchSessions = useCallback(
        async (pageNum: number = 1) => {
            setError(null);
            try {
                const res = await axios.get(
                    `${API_BASE_URL}/stt/session-messages/${canvasIdx}?page=${pageNum}`,
                );

                if (res.data.success) {
                    // 백엔드 응답 구조에 맞게 수정
                    const sessions: ChatSession[] = res.data.messages.map((msg: any) => ({
                        sessionId: msg.messageId,
                        segments: msg.segments.map((seg: any) => ({
                            speakerTag: seg.speakerTag,
                            textContent: seg.textContent,
                            startTime: parseFloat(seg.startTime),
                            endTime: parseFloat(seg.endTime),
                            audioUrl: msg.audioUrl,
                        })),
                        timestamp: msg.timestamp,
                        mentor_idx: msg.mentor_idx,
                        mentee_idx: msg.mentee_idx,
                        segmentIndex: msg.segmentIndex,
                    }));

                    return sessions;
                } else {
                    setError(res.data.message);
                    return [];
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Unknown error');
                return [];
            }
        },
        [canvasIdx],
    );

    // 드래그 핸들러
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragState.current.dragging) return;
            const nextX = e.clientX - dragState.current.offsetX;
            const nextY = e.clientY - dragState.current.offsetY;
            const maxX = window.innerWidth - 280;
            const maxY = window.innerHeight - 180;
            setPos({
                x: Math.max(0, Math.min(nextX, maxX)),
                y: Math.max(0, Math.min(nextY, maxY)),
            });
        };
        const onUp = () => {
            dragState.current.dragging = false;
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const sessions = await fetchSessions(1);
                    setSessions(sessions); // ✅ 이 부분이 누락됨
                } catch (error) {
                    console.error('Failed to load sessions:', error);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [isOpen, fetchSessions]);

    // 무한스크롤
    const loadMore = useCallback(async () => {
        if (loading) return;
        setLoading(true);

        try {
            const newSessions = await fetchSessions(page + 1);
            if (newSessions.length > 0) {
                setSessions((prev) => [...prev, ...newSessions]);
                setPage((p) => p + 1);
            }
        } catch (error) {
            console.error('Failed to load more sessions:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, page, fetchSessions]);

    // 녹음메모 클릭 핸들러 (전체 오디오 재생)
    const handleRecordingClick = useCallback(
        (item: RecordingItem) => {
            setSelected(item);

            // 해당 세션의 전체 오디오 재생
            const session = sessions.find((s) => `rec-${s.sessionId}` === item.id);
            if (session && session.segments.length > 0) {
                playFullSession(session);
            }
        },
        [sessions, playFullSession],
    );

    // 녹음 목록 아이템 생성
    const items = useMemo<RecordingItem[]>(() => {
        return sessions.map((session) => ({
            id: `rec-${session.sessionId}`,
            title: `음성 메모 ${session.segmentIndex}`,
            durationSec: Math.max(...session.segments.map((s) => s.endTime)),
            createdAt: new Date(session.timestamp).toLocaleString(),
        }));
    }, [sessions]);

    // STT 타임라인 데이터 생성
    const transcripts = useMemo<TranscriptItem[]>(() => {
        if (!selected) return [];

        const session = sessions.find((s) => `rec-${s.sessionId}` === selected.id);
        if (!session) return [];

        return session.segments.map((seg, idx) => ({
            id: `${selected.id}-line-${idx + 1}`,
            speaker: seg.speakerTag === 0 ? '멘토' : '멘티',
            timeSec: seg.startTime,
            text: seg.textContent,
            segment: seg,
            session: session,
        }));
    }, [selected, sessions]);

    // 오디오 재생/일시정지 핸들러
    const handlePlayPause = useCallback(() => {
        if (audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play().catch(console.error);
            } else {
                audioRef.current.pause();
            }
        }
    }, [audioRef]);

    // 뒤로가기 핸들러
    const handleBack = useCallback(() => {
        setSelected(null);
        stopAudio();
    }, [stopAudio]);

    // 닫기 핸들러
    const handleClose = useCallback(() => {
        setOpen(false);
        stopAudio();
    }, [setOpen, stopAudio]);

    if (!isOpen) return null;

    return (
        <>
            {/* 오디오 플레이어 */}
            <AudioPlayer
                playingSegment={playingSegment}
                currentSegment={currentSegment}
                currentSession={currentSession}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onClose={stopAudio}
            />

            {/* 숨겨진 오디오 엘리먼트 */}
            {playingSegment && currentSegment && (
                <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnd}
                    className='hidden'
                    controls={false}
                    preload='none'
                    muted={false}
                >
                    {getAudioSources(currentSegment.audioUrl).map((source, index) => (
                        <source key={index} src={source.src} type={source.type} />
                    ))}
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
                <div className='w-[380px] min-h-[260px] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden'>
                    {/* 헤더 */}
                    <div
                        className='h-10 px-2 flex items-center justify-between bg-slate-50 border-b border-slate-200 cursor-move select-none'
                        onMouseDown={(e) => {
                            const rect = (
                                e.currentTarget.parentElement as HTMLElement
                            ).getBoundingClientRect();
                            dragState.current.dragging = true;
                            dragState.current.offsetX = e.clientX - rect.left;
                            dragState.current.offsetY = e.clientY - rect.top;
                        }}
                    >
                        <div className='flex items-center gap-1'>
                            {selected && (
                                <button
                                    aria-label='뒤로'
                                    className='p-1 rounded hover:bg-slate-200 cursor-pointer'
                                    onClick={handleBack}
                                >
                                    <LeftOutlined style={{ fontSize: 14, color: '#334155' }} />
                                </button>
                            )}
                            <span className='text-sm font-medium text-slate-700'>
                                {selected ? `${selected.title} • STT 타임라인` : '녹음 목록'}
                            </span>
                        </div>
                        <button
                            aria-label='닫기'
                            className='p-1 rounded hover:bg-slate-200'
                            onClick={handleClose}
                        >
                            <CloseOutlined style={{ fontSize: 14, color: '#334155' }} />
                        </button>
                    </div>

                    {/* 컨텐츠 */}
                    {selected ? (
                        <TranscriptList
                            transcripts={transcripts}
                            playingSegment={playingSegment}
                            onPlaySegment={playSegment}
                            isFullSessionMode={isFullSessionMode}
                            audioRef={audioRef}
                        />
                    ) : (
                        <RecordingList
                            items={items}
                            loading={loading}
                            onRecordingClick={handleRecordingClick}
                            onSelectItem={setSelected}
                            onLoadMore={loadMore}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
