'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import { List } from 'antd';
import Image from 'next/image';
import axios from 'axios';
import { useCanvasStore } from '../_stores';
import { customAudioPlayer } from '../_hooks';
import { API_BASE_URL } from '@/constants/config';

interface SpeakerSegment {
    speakerTag: number;
    textContent: string; // textcontent → textContent로 수정
    startTime: number;
    endTime: number;
    audioUrl: string;
}

// 20-27번 라인 수정
interface ChatSession {
    sessionId: number;
    segments: SpeakerSegment[];
    timestamp: string; // timestamps → timestamp로 수정
    mentor_idx: number;
    mentee_idx: number; // memtee_idx → mentee_idx로 수정
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

    /* 오디오 재생 관련 상태 */
    const [playingSegment, setPlayingSegment] = useState<SpeakerSegment | null>(null);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [currentSegment, setCurrentSegment] = useState<SpeakerSegment | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    /* 데이터 관련 상태 */
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<RecordingItem | null>(null);

    const canvasIdx = 'default-canvas-uuid';

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!dragState.current.dragging) return;
            const nextX = e.clientX - dragState.current.offsetX;
            const nextY = e.clientY - dragState.current.offsetY;
            // keep within viewport bounds
            const maxX = window.innerWidth - 280; // approx width
            const maxY = window.innerHeight - 180; // approx height
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
            fetchSessions();
        }
    }, [isOpen]);

    // 백엔드에서 세션 데이터 가져오기
    const fetchSessions = async (page: number = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/stt/session-messages/${canvasIdx}?page=${page}`,
            );
            if (res.data.success) {
                const sessionsWithSegments: ChatSession[] = res.data.messages.map((msg: any) => ({
                    sessionId: msg.messageId,
                    segments: msg.segments.map((seg: any) => ({
                        speakerTag: seg.speakerTag,
                        textContent: seg.textContent,
                        startTime: seg.startTime,
                        endTime: seg.endTime,
                        audioUrl: msg.audioUrl,
                    })),
                    timestamp: msg.timestamp,
                    mentor_idx: msg.mentor_idx,
                    mentee_idx: msg.mentee_idx,
                    segmentIndex: msg.segmentIndex,
                }));

                const sortedSessions = sessionsWithSegments
                    .sort((a, b) => a.segmentIndex - b.segmentIndex)
                    .map((session) => ({
                        ...session,
                        segments: session.segments.sort((a, b) => a.startTime - b.startTime),
                    }));

                setSessions(sortedSessions); // ← 이 줄 추가: 상태에 저장
                return sortedSessions;
            } else {
                setError(res.data.message);
                return [];
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error');
            return [];
        } finally {
            setLoading(false);
        }
    };

    // 녹음 목록 아이템 생성 (세션 데이터 기반)
    const items = useMemo<RecordingItem[]>(() => {
        return sessions.map((session) => ({
            id: `rec-${session.sessionId}`,
            title: `음성 메모 ${session.segmentIndex}`,
            durationSec: Math.max(...session.segments.map((s) => s.endTime)),
            createdAt: new Date(session.timestamp).toLocaleString(),
            sessionId: session.sessionId,
            segmentIndex: session.segmentIndex,
        }));
    }, [sessions]);

    /* 무한스크롤 */
    const [page, setPage] = useState(1);
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
    }, [loading, page]);

    // 상세보기 상태: 선택된 녹음 및 STT 라인업
    const transcripts = useMemo<TranscriptItem[]>(() => {
        if (!selected) return [];

        // 선택된 아이템에 해당하는 실제 세션 데이터 찾기
        const session = sessions.find((s) => `rec-${s.sessionId}` === selected.id);
        if (!session) return [];

        return session.segments.map((seg, idx) => ({
            id: `${selected.id}-line-${idx + 1}`,
            speaker: seg.speakerTag === 0 ? '멘토' : '멘티',
            timeSec: seg.startTime,
            text: seg.textContent,
        }));
    }, [selected, sessions]);

    if (!isOpen) return null;

    return (
        <div
            className='fixed z-[50]'
            style={{ left: pos.x, top: pos.y }}
            role='dialog'
            aria-modal='false'
            aria-label='녹음 목록'
        >
            <div className='w-[380px] min-h-[260px] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden'>
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected(null);
                                }}
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
                        onClick={() => setOpen(false)}
                    >
                        <CloseOutlined style={{ fontSize: 14, color: '#334155' }} />
                    </button>
                </div>
                {selected ? (
                    <div className='p-2 max-h-[400px] overflow-auto'>
                        <List
                            size='small'
                            itemLayout='vertical'
                            dataSource={transcripts}
                            renderItem={(line) => (
                                <List.Item className='px-2 py-1'>
                                    <div className='flex items-start gap-2 w-full'>
                                        <div
                                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                line.speaker === '멘토'
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                            {line.speaker}
                                        </div>
                                        <div className='text-[11px] text-slate-500 mt-0.5'>
                                            {`${Math.floor(line.timeSec / 60)}:${String(
                                                line.timeSec % 60,
                                            ).padStart(2, '0')}`}
                                        </div>
                                    </div>
                                    <div className='mt-1 text-[13px] leading-relaxed text-slate-800'>
                                        {line.text}
                                    </div>
                                </List.Item>
                            )}
                        />
                    </div>
                ) : (
                    <div
                        className='p-2 max-h-[400px] overflow-auto'
                        onScroll={(e) => {
                            const el = e.currentTarget;
                            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
                                loadMore();
                            }
                        }}
                    >
                        <List
                            size='small'
                            itemLayout='horizontal'
                            dataSource={items}
                            renderItem={(item) => (
                                <List.Item
                                    className='px-2 cursor-pointer hover:bg-slate-50 rounded'
                                    onClick={() => setSelected(item)}
                                >
                                    <div className='flex items-start gap-3 w-full py-1'>
                                        <div className='w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0'>
                                            <Image
                                                src='/assets/mic.svg'
                                                alt='mic'
                                                width={14}
                                                height={14}
                                            />
                                        </div>
                                        <div className='flex-1'>
                                            <div className='text-slate-800 text-sm'>
                                                {item.title}
                                            </div>
                                            <div className='text-[12px] text-slate-500'>{`${Math.floor(
                                                item.durationSec / 60,
                                            )}:${String(item.durationSec % 60).padStart(
                                                2,
                                                '0',
                                            )} • ${item.createdAt}`}</div>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                        {loading && (
                            <div className='py-2 text-center text-xs text-slate-500'>
                                불러오는 중…
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
