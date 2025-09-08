'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Spin, Empty } from 'antd';

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
}

interface ReplayChatProps {
    canvasIdx: number;
    isOpen: boolean;
    currentUserId?: number;
}

// 윈도우 크기 훅
const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

export function ReplayChat({ canvasIdx, isOpen, currentUserId }: ReplayChatProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playingSegment, setPlayingSegment] = useState<string | null>(null);
    const [currentSegment, setCurrentSegment] = useState<SpeakerSegment | null>(null);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [playerHeight, setPlayerHeight] = useState(0);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { width, height } = useWindowSize();

    // 테스트 모드 판단
    const isTestMode = !currentUserId;

    // speakerTag를 현재 사용자 기준으로 변환하는 함수
    const getNormalizedSpeakerTag = (segment: SpeakerSegment, session: ChatSession) => {
        if (isTestMode) {
            return segment.speakerTag;
        }

        const mentorIdx = session.mentor_idx;
        const menteeIdx = session.mentee_idx;

        // 백엔드에서 이미 변환된 speakerTag 사용
        // speakerTag 0 = 멘토, speakerTag 1 = 멘티
        const actualUserId = segment.speakerTag === 0 ? mentorIdx : menteeIdx;

        // 현재 사용자면 0 (파란색, 오른쪽), 상대방이면 1 (회색, 왼쪽)
        return actualUserId === currentUserId ? 0 : 1;
    };

    // 오디오 시작 위치 설정 및 자동재생
    useEffect(() => {
        if (audioRef.current && currentSegment) {
            const audio = audioRef.current;

            const handleLoadedMetadata = () => {
                // 시간 오프셋 보정 (0.5초 빼기)
                const timeOffset = 0.5;
                const correctedStartTime = Math.max(0, currentSegment.startTime - timeOffset);
                audio.currentTime = correctedStartTime;
                // 자동재생 시작
                audio.play().catch(console.error);
            };

            if (audio.readyState >= 1) {
                // HAVE_METADATA
                handleLoadedMetadata();
            } else {
                audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            }

            return () => {
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
        }
    }, [currentSegment]);

    // 플레이어 높이 측정
    useEffect(() => {
        if (playingSegment) {
            const playerElement = document.querySelector('.audio-player');
            if (playerElement) {
                setPlayerHeight(playerElement.getBoundingClientRect().height);
            }
        } else {
            setPlayerHeight(0);
        }
    }, [playingSegment]);

    // 파일 포맷 감지
    const getAudioSource = (audioUrl: string) => {
        const extension = audioUrl.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'webm':
                return <source src={audioUrl} type='audio/webm' />;
            case 'mp4':
            case 'm4a':
                return <source src={audioUrl} type='audio/mp4' />;
            case 'wav':
                return <source src={audioUrl} type='audio/wav' />;
            case 'mp3':
                return <source src={audioUrl} type='audio/mpeg' />;
            default:
                return (
                    <>
                        <source src={audioUrl} type='audio/webm' />
                        <source src={audioUrl} type='audio/mp4' />
                        <source src={audioUrl} type='audio/wav' />
                    </>
                );
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        fetchSessions();
    }, [isOpen]);

    // 컴포넌트 언마운트 시 오디오 정리
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/stt/session-messages/${canvasIdx}`);
            if (res.data.success) {
                const sessionsWithSegments: ChatSession[] = await Promise.all(
                    res.data.messages.map(async (msg: any) => {
                        const contextRes = await axios.get(
                            `${API_BASE_URL}/stt/context/${msg.messageId}`,
                        );
                        const segments: SpeakerSegment[] = contextRes.data.speakers.map(
                            (seg: any) => ({
                                speakerTag: seg.speakerTag,
                                textContent: seg.text,
                                startTime: seg.startTime,
                                endTime: seg.endTime,
                                audioUrl: msg.audioUrl,
                            }),
                        );
                        return {
                            sessionId: msg.messageId,
                            segments,
                            timestamp: msg.timestamp,
                            mentor_idx: msg.mentor_idx,
                            mentee_idx: msg.mentee_idx,
                        };
                    }),
                );
                const sortedSessions = sessionsWithSegments.map((session) => ({
                    ...session,
                    segments: session.segments.sort((a, b) => a.startTime - b.startTime),
                }));
                setSessions(sortedSessions.reverse());
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } else {
                setError(res.data.message);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const playSegment = (segment: SpeakerSegment, session: ChatSession, segmentIdx: number) => {
        const segmentKey = `${session.sessionId}-${segmentIdx}`;

        // 이미 재생 중인 세그먼트면 무시
        if (playingSegment === segmentKey) {
            return;
        }

        // 새로운 세그먼트 재생
        setPlayingSegment(segmentKey);
        setCurrentSegment(segment);
        setCurrentSession(session);
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingSegment(null);
        setCurrentSegment(null);
        setCurrentSession(null);
    };

    // 오디오 종료 시 자동 정리
    const handleAudioEnd = () => {
        setPlayingSegment(null);
        setCurrentSegment(null);
        setCurrentSession(null);
        if (audioRef.current) {
            audioRef.current = null;
        }
    };

    // 오디오 시간 업데이트 (세그먼트 종료 시 자동 정지)
    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const audio = e.currentTarget;
        if (currentSegment && audio.currentTime >= currentSegment.endTime) {
            audio.pause();
            handleAudioEnd();
        }
    };

    if (!isOpen) return null;
    if (loading) return <Spin tip='Loading...' />;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (sessions.length === 0) return <Empty description='No sessions found' />;

    return (
        <>
            {/* 상단 고정 오디오 플레이어 */}
            {playingSegment && currentSegment && currentSession && (
                <div className='audio-player fixed bottom-[800px] left-0 right-0 z-50'>
                    <div className='max-w-4xl mx-auto p-4'>
                        <div className='flex items-center justify-center'>
                            {/* 오디오 플레이어만 */}
                            <div className='flex items-center space-x-4'>
                                <audio
                                    ref={audioRef}
                                    controls
                                    className='h-10'
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={handleAudioEnd}
                                >
                                    {getAudioSource(currentSegment.audioUrl)}
                                    Your browser does not support the audio element.
                                </audio>

                                {/* 닫기 버튼 */}
                                <button
                                    onClick={stopAudio}
                                    className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors'
                                >
                                    <svg
                                        className='w-5 h-5'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 다시보기 리스트 - 고정 형식 */}
            <div
                className={`fixed bottom-[60px] left-1/2 transform -translate-x-1/2 w-[400px] max-h-[400px] overflow-y-auto bg-white border rounded-lg p-2 shadow-lg ${
                    playingSegment ? 'mt-20' : ''
                }`}
            >
                {sessions.map((session) => (
                    <div key={session.sessionId} className='mb-4'>
                        {session.segments.map((seg, idx) => {
                            const normalizedSpeakerTag = getNormalizedSpeakerTag(seg, session);
                            const isCurrentlyPlaying =
                                playingSegment === `${session.sessionId}-${idx}`;

                            return (
                                <div
                                    key={idx}
                                    className={`flex mb-1 ${
                                        normalizedSpeakerTag === 0 ? 'justify-end' : 'justify-start'
                                    }`}
                                >
                                    {/* 말풍선 클릭 시 오디오 재생 */}
                                    <div
                                        className={`p-2 rounded-lg max-w-[70%] break-words transition-all duration-200 cursor-pointer hover:shadow-md ${
                                            normalizedSpeakerTag === 0
                                                ? 'bg-blue-500 text-white hover:bg-blue-600' // 0=자신=파란색, 오른쪽
                                                : 'bg-gray-200 text-black hover:bg-gray-300' // 1=상대방=회색, 왼쪽
                                        } ${isCurrentlyPlaying ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
                                        onClick={() => playSegment(seg, session, idx)}
                                    >
                                        {/* STT 텍스트와 시간 표시 */}
                                        <div className='flex justify-between items-start mb-1'>
                                            <div className='flex-1'>{seg.textContent}</div>
                                            <div
                                                className={`text-xs ml-2 ${
                                                    normalizedSpeakerTag === 0
                                                        ? 'text-blue-100'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {Math.floor(seg.startTime / 60)}:
                                                {(seg.startTime % 60).toFixed(0).padStart(2, '0')}
                                            </div>
                                        </div>

                                        {/* 재생 아이콘 */}
                                        <div className='flex items-center justify-end mt-1'>
                                            <div
                                                className={`text-xs ${
                                                    normalizedSpeakerTag === 0
                                                        ? 'text-blue-200'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {isCurrentlyPlaying ? ' 재생 중' : '클릭하여 재생'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className='text-xs text-gray-400 text-center'>
                            {new Date(session.timestamp).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef}></div>
            </div>
        </>
    );
}
