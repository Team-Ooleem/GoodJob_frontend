'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Spin, Empty } from 'antd';

interface SpeakerSegment {
    speakerTag: number; // speaker_idx → speakerTag로 변경
    textContent: string; // text → textContent로 변경
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

export function ReplayChat({ canvasIdx, isOpen, currentUserId }: ReplayChatProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playingSegment, setPlayingSegment] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 테스트 모드 판단: currentUserId가 없으면 테스트 모드
    const isTestMode = !currentUserId;

    // speakerTag를 현재 사용자 기준으로 변환하는 함수
    const getNormalizedSpeakerTag = (segment: SpeakerSegment, session: ChatSession) => {
        if (isTestMode) {
            // 테스트 모드: 원본 speakerTag 그대로 사용
            return segment.speakerTag;
        }

        // 실제 모드: 사용자 기준으로 변환
        const mentorIdx = session.mentor_idx;
        const menteeIdx = session.mentee_idx;

        // Google STT의 speakerTag를 실제 사용자 ID로 변환
        const actualUserId = segment.speakerTag === 0 ? mentorIdx : menteeIdx;

        // 현재 사용자면 0, 상대방이면 1로 변환
        return actualUserId === currentUserId ? 0 : 1;
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
            const res = await axios.get(
                `http://localhost:4000/api/stt/session-messages/${canvasIdx}`,
            );
            if (res.data.success) {
                const sessionsWithSegments: ChatSession[] = await Promise.all(
                    res.data.messages.map(async (msg: any) => {
                        const contextRes = await axios.get(
                            `http://localhost:4000/api/stt/context/${msg.messageId}`,
                        );
                        const segments: SpeakerSegment[] = contextRes.data.speakers.map(
                            (seg: any) => ({
                                speakerTag: seg.speakerTag, // speakerTag 그대로 사용
                                textContent: seg.text, // text → textContent
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

    const playSegment = async (segment: SpeakerSegment, sessionId: number, segmentIdx: number) => {
        const segmentKey = `${sessionId}-${segmentIdx}`;

        // 이미 재생 중인 세그먼트가 있다면 정지
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (playingSegment === segmentKey) {
            setPlayingSegment(null);
            return;
        }

        try {
            setPlayingSegment(segmentKey);
            const audio = new Audio(segment.audioUrl);
            audioRef.current = audio;

            // startTime으로 이동 (정규화된 시간 사용)
            audio.currentTime = segment.startTime;

            // endTime에 도달하면 정지
            const checkTime = () => {
                if (audio.currentTime >= segment.endTime) {
                    audio.pause();
                    setPlayingSegment(null);
                    audioRef.current = null;
                }
            };

            audio.addEventListener('timeupdate', checkTime);
            audio.addEventListener('ended', () => {
                setPlayingSegment(null);
                audioRef.current = null;
            });

            await audio.play();
        } catch (error) {
            console.error('Audio play failed:', error);
            setPlayingSegment(null);
            audioRef.current = null;
        }
    };

    if (!isOpen) return null;
    if (loading) return <Spin tip='Loading...' />;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (sessions.length === 0) return <Empty description='No sessions found' />;

    return (
        <div className='fixed bottom-[60px] left-1/2 transform -translate-x-1/2 w-[400px] max-h-[400px] overflow-y-auto bg-white border rounded-lg p-2 shadow-lg'>
            {sessions.map((session) => (
                <div key={session.sessionId} className='mb-4'>
                    {session.segments.map((seg, idx) => {
                        const normalizedSpeakerTag = getNormalizedSpeakerTag(seg, session);

                        return (
                            <div
                                key={idx}
                                className={`flex mb-1 ${
                                    normalizedSpeakerTag === 0 ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                <div
                                    className={`p-2 rounded-lg max-w-[70%] break-words ${
                                        normalizedSpeakerTag === 0
                                            ? 'bg-blue-500 text-white' // 0=자신=파란색
                                            : 'bg-gray-200 text-black' // 1=상대방=회색
                                    }`}
                                >
                                    <div className='flex justify-between items-start'>
                                        <div>{seg.textContent}</div> {/* text → textContent */}
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
                                    <Button
                                        type='link'
                                        size='small'
                                        onClick={() => playSegment(seg, session.sessionId, idx)}
                                    >
                                        {playingSegment === `${session.sessionId}-${idx}`
                                            ? '⏸️'
                                            : '▶️'}
                                    </Button>
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
    );
}
