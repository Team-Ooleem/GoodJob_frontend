'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { List } from 'antd';
import Image from 'next/image';
import { useCanvasStore } from '../_stores';

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
    const [items, setItems] = useState(() =>
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
        const next = Array.from({ length: 20 }).map((_, idx) => ({
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

    if (!isOpen) return null;

    return (
        <div
            className='fixed z-[50]'
            style={{ left: pos.x, top: pos.y }}
            role='dialog'
            aria-modal='false'
            aria-label='녹음 목록'
        >
            <div className='w-[340px] min-h-[220px] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden'>
                <div
                    className='h-10 px-3 flex items-center justify-between bg-slate-50 border-b border-slate-200 cursor-move select-none'
                    onMouseDown={(e) => {
                        const rect = (
                            e.currentTarget.parentElement as HTMLElement
                        ).getBoundingClientRect();
                        dragState.current.dragging = true;
                        dragState.current.offsetX = e.clientX - rect.left;
                        dragState.current.offsetY = e.clientY - rect.top;
                    }}
                >
                    <span className='text-sm font-medium text-slate-700'>녹음 목록</span>
                    <button
                        aria-label='닫기'
                        className='p-1 rounded hover:bg-slate-200'
                        onClick={() => setOpen(false)}
                    >
                        <CloseOutlined style={{ fontSize: 14, color: '#334155' }} />
                    </button>
                </div>
                <div
                    className='p-2 max-h-[360px] overflow-auto'
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
                            <List.Item className='px-2'>
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
                                        <div className='text-slate-800 text-sm'>{item.title}</div>
                                        <div className='text-[12px] text-slate-500'>{`${Math.floor(
                                            item.durationSec / 60,
                                        )}:${String(item.durationSec % 60).padStart(2, '0')} • ${
                                            item.createdAt
                                        }`}</div>
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                    {loading && (
                        <div className='py-2 text-center text-xs text-slate-500'>불러오는 중…</div>
                    )}
                </div>
            </div>
        </div>
    );
}
