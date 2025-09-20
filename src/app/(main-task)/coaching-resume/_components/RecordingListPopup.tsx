'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useCanvasStore } from '../_stores/useCanvasStore';
import { useAudioPlayer } from '../_hooks/useAudioPlayer';
import { useDragPosition } from '../_hooks/useDragPosition';
import { useSessionData } from '../_hooks/useSessionData';
import TranscriptList from './TranscriptList';
import { ChatSession, SpeakerSegment, TranscriptItem } from '@/apis/recoding-api';
import { useParams } from 'next/navigation';

export function RecordingListPopup() {
    const { sessionId } = useParams<{ sessionId: string }>();
    // 스토어에서 상태 가져오기
    const isOpen = useCanvasStore((s) => s.isRecordingListOpen);
    const setOpen = useCanvasStore((s) => s.setRecordingListOpen);

    // 커스텀 훅들
    const { pos, handleMouseDown } = useDragPosition();

    // 해당 캔버스의 세션 데이터 로드
    const { sessions: apiSessions, loading, fetchSessionMessages } = useSessionData(sessionId);

    // AudioPlayer에서 필요한 것들 가져오기
    const {
        currentSession,
        playingSegment,
        currentTime,
        setSeekToTime,
        setCurrentSession,
        stopAudio,
        recentSessions,
        togglePlayPause,
    } = useAudioPlayer();

    // 팝업이 열릴 때 해당 캔버스 데이터 로드
    useEffect(() => {
        if (isOpen && sessionId) {
            fetchSessionMessages(1);
        }
    }, [isOpen, sessionId, fetchSessionMessages]);

    // recentSessions와 API 세션 통합 (중복 제거)
    const allSessions = useMemo(() => {
        const combined = [...(recentSessions || []), ...(apiSessions || [])];
        return combined.filter(
            (session, index, self) =>
                index === self.findIndex((s) => s.sessionIdx === session.sessionIdx),
        );
    }, [recentSessions, apiSessions]);

    // 첫 번째 세션을 자동으로 선택
    useEffect(() => {
        if (isOpen && allSessions.length > 0 && !currentSession) {
            setCurrentSession(allSessions[0] as unknown as ChatSession);
        }
    }, [isOpen, allSessions, currentSession, setCurrentSession]);

    const transcripts = useMemo<TranscriptItem[]>(() => {
        if (!currentSession) return [];

        return currentSession.segments.map((seg, idx) => ({
            id: `line-${idx + 1}`,
            speaker:
                seg.speakerTag === 1
                    ? currentSession.mentor_name || '멘토'
                    : currentSession.mentee_name || '멘티',
            timeSec: seg.startTime,
            text: seg.textContent,
            segment: seg,
            session: currentSession,
        }));
    }, [currentSession]);

    // STT 타임라인 클릭 시 해당 시간으로 이동하고 자동 재생
    const handleSegmentClick = useCallback(
        (segment: SpeakerSegment, session: ChatSession) => {
            setSeekToTime(segment.startTime);

            // 잠시 후 자동 재생 시작 (시간 이동 후)
            setTimeout(() => {
                togglePlayPause(); // 재생 시작
            }, 100);
        },
        [setSeekToTime, togglePlayPause],
    );

    const handleClose = useCallback(() => {
        setOpen(false);
        stopAudio();
    }, [setOpen, stopAudio]);

    if (!isOpen) return null;

    return (
        <>
            {/*shadcn/ui 디자인 토큰 적용된 메인 팝업 */}
            <div
                className='fixed z-[50]'
                style={{ left: pos.x, top: pos.y }}
                role='dialog'
                aria-modal='false'
                aria-label='STT 타임라인'
            >
                <div className='w-[380px] h-[400px] bg-card border rounded-lg shadow-lg overflow-hidden flex flex-col'>
                    {/*shadcn/ui 헤더 스타일 */}
                    <div
                        className='h-12 px-4 flex items-center justify-between bg-muted/50 border-b cursor-move select-none flex-shrink-0'
                        onMouseDown={handleMouseDown}
                    >
                        <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium text-foreground'>
                                STT 타임라인
                            </span>
                            {loading && (
                                <div className='h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                            )}
                        </div>
                        <button
                            aria-label='닫기'
                            className='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8'
                            onClick={handleClose}
                        >
                            <X className='h-4 w-4' />
                        </button>
                    </div>

                    {/* 콘텐츠 영역 - STT 타임라인만 표시 */}
                    <div className='flex-1 overflow-hidden flex flex-col min-h-0'>
                        {loading ? (
                            // 로딩 상태
                            <div className='flex-1 flex items-center justify-center'>
                                <div className='text-center'>
                                    <div className='h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2' />
                                    <p className='text-sm text-muted-foreground'>
                                        세션 데이터를 불러오는 중...
                                    </p>
                                </div>
                            </div>
                        ) : allSessions.length === 0 ? (
                            // 세션이 없는 경우
                            <div className='flex-1 flex flex-col items-center justify-center p-4 text-center'>
                                <div className='text-muted-foreground mb-2'>
                                    <svg
                                        className='h-12 w-12 mx-auto mb-4'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={1}
                                            d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
                                        />
                                    </svg>
                                </div>
                                <h3 className='text-sm font-medium text-foreground mb-2'>
                                    녹음 데이터가 없습니다
                                </h3>
                                <p className='text-xs text-muted-foreground'>
                                    이 캔버스에 대한 녹음된 세션이 없습니다.
                                </p>
                            </div>
                        ) : (
                            // 정상 상태 - 트랜스크립트 표시
                            <TranscriptList
                                transcripts={transcripts}
                                playingSegment={playingSegment}
                                onPlaySegment={handleSegmentClick}
                                currentTime={currentTime}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
