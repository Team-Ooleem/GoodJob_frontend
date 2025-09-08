'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import { List } from 'antd';
import Image from 'next/image';
import { useCanvasStore } from '../_stores';

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

    // Infinite scroll dataset (mock)
    const [items, setItems] = useState<RecordingItem[]>(() =>
        Array.from({ length: 20 }).map((_, i) => ({
            id: `rec-${i + 1}`,
            title: `음성 메모 ${i + 1}`,
            durationSec: 60 + (i % 10) * 7,
            createdAt: new Date(Date.now() - i * 3600_000).toLocaleString(),
        })),
    );
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const loadMore = useCallback(() => {
        if (loading) return;
        setLoading(true);
        const start = page * 20;
        const next: RecordingItem[] = Array.from({ length: 20 }).map((_, idx) => ({
            id: `rec-${start + idx + 1}`,
            title: `음성 메모 ${start + idx + 1}`,
            durationSec: 60 + ((start + idx) % 10) * 7,
            createdAt: new Date(Date.now() - (start + idx) * 3600_000).toLocaleString(),
        }));
        setTimeout(() => {
            setItems((prev) => [...prev, ...next]);
            setPage((p) => p + 1);
            setLoading(false);
        }, 400);
    }, [loading, page]);

    // 상세보기 상태: 선택된 녹음 및 STT 라인업
    const [selected, setSelected] = useState<RecordingItem | null>(null);
    const transcripts = useMemo<TranscriptItem[]>(() => {
        if (!selected) return [];
        return Array.from({ length: 24 }).map((_, i) => ({
            id: `${selected.id}-line-${i + 1}`,
            speaker: i % 2 === 0 ? '멘티' : '멘토',
            timeSec: 5 + i * 7,
            text:
                i % 2 === 0
                    ? '이 부분에서 자기소개를 조금 더 간결하게 해보겠습니다.'
                    : '좋아요, 핵심 강점을 먼저 말하고 사례를 붙여보세요.',
        }));
    }, [selected]);

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
