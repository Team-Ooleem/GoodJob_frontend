'use client';

import { useEffect, useRef, useState } from 'react';
import { CloseOutlined } from '@ant-design/icons';
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

    if (!isOpen) return null;

    return (
        <div
            className='fixed z-[50]'
            style={{ left: pos.x, top: pos.y }}
            role='dialog'
            aria-modal='false'
            aria-label='녹음 목록'
        >
            <div className='w-[320px] min-h-[180px] bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-slate-200 overflow-hidden'>
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
                <div className='p-3 text-sm text-slate-600'>
                    {/* TODO: 실제 녹음 리스트 렌더링 */}
                    <p className='text-slate-500'>최근 녹음이 여기에 표시됩니다.</p>
                </div>
            </div>
        </div>
    );
}
