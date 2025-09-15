'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { CloseOutlined, LeftOutlined } from '@ant-design/icons';
import { useCanvasStore } from '../_stores/useCanvasStore';
import { useRecordingStore } from '../_stores/useRecordingStore';
import { useAudioPlayer } from '../_hooks/useAudioPlayer';
import { useSessionData } from '../_hooks/useSessionData';
import { useDragPosition } from '../_hooks/useDragPosition';
import TranscriptList from './TranscriptList';
import RecordingList from './RecordingList';
import { ChatSession, SpeakerSegment, TranscriptItem } from '@/apis/recoding-api';

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
    const { selectedRecording, setSelectedRecording } = useRecordingStore();

    // 커스텀 훅들
    const { pos, handleMouseDown } = useDragPosition();
    const { sessions, loading, error, fetchSessionMessages, loadMore, setSessions } =
        useSessionData('resume-room');

    // 오디오 플레이어 훅 - prepareAudio 함수 추가
    const {
        playingSegment,
        currentSession,
        currentSegment,
        currentTime,
        duration,
        isPlaying,
        isFullSessionMode,
        playSegment,
        stopAudio,
        prepareAudio,
    } = useAudioPlayer();

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

    // 세션 선택 시 오디오 준비
    useEffect(() => {
        if (selectedRecording && sessions.length > 0) {
            const session = sessions.find((s) => `rec-${s.sessionIdx}` === selectedRecording.id);
            if (session) {
                // useAudioPlayer의 prepareAudio 함수 사용
                prepareAudio(session as unknown as ChatSession);
            }
        }
    }, [selectedRecording, sessions, prepareAudio]);

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
            durationSec: Math.floor(getTotalDuration(session)),
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
            session: session,
        }));
    }, [selectedRecording, sessions]);

    // 핸들러들
    const handleSegmentClick = useCallback(
        (segment: SpeakerSegment, session: ChatSession) => {
            playSegment(segment, session);
        },
        [playSegment],
    );

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
