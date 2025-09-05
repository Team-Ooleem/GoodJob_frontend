'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Spin, Empty } from 'antd';

interface SpeakerSegment {
    speakerTag: number; // 0=mentor, 1=mentee
    text: string;
    startTime: number;
    endTime: number;
    audioUrl: string;
}

interface ChatSession {
    sessionId: number;
    segments: SpeakerSegment[];
    timestamp: string;
}

interface ReplayChatProps {
    canvasIdx: number;
    isOpen: boolean;
}

export function ReplayChat({ canvasIdx, isOpen }: ReplayChatProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        fetchSessions();
    }, [isOpen]);

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`localhost:4000/api/stt/session-messages/${canvasIdx}`);
            if (res.data.success) {
                const sessionsWithSegments: ChatSession[] = await Promise.all(
                    res.data.messages.map(async (msg: any) => {
                        const contextRes = await axios.get(
                            `localhost:4000/api/stt/context/${msg.messageId}`,
                        );
                        const segments: SpeakerSegment[] = contextRes.data.speakers.map(
                            (seg: any) => ({
                                speakerTag: seg.speakerTag,
                                text: seg.text,
                                startTime: seg.startTime,
                                endTime: seg.endTime,
                                audioUrl: msg.audioUrl,
                            }),
                        );
                        return {
                            sessionId: msg.messageId,
                            segments,
                            timestamp: msg.timestamp,
                        };
                    }),
                );
                setSessions(sessionsWithSegments);
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

    if (!isOpen) return null;
    if (loading) return <Spin tip='Loading...' />;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (sessions.length === 0) return <Empty description='No sessions found' />;

    return (
        <div className='fixed bottom-[60px] left-1/2 transform -translate-x-1/2 w-[400px] max-h-[400px] overflow-y-auto bg-white border rounded-lg p-2 shadow-lg'>
            {sessions.map((session) => (
                <div key={session.sessionId} className='mb-4'>
                    {session.segments.map((seg, idx) => (
                        <div
                            key={idx}
                            className={`flex mb-1 ${
                                seg.speakerTag === 0 ? 'justify-start' : 'justify-end'
                            }`}
                        >
                            <div
                                className={`p-2 rounded-lg max-w-[70%] break-words ${
                                    seg.speakerTag === 0
                                        ? 'bg-gray-200 text-black'
                                        : 'bg-blue-500 text-white'
                                }`}
                            >
                                <div>{seg.text}</div>
                                <Button
                                    type='link'
                                    size='small'
                                    onClick={() => new Audio(seg.audioUrl).play()}
                                >
                                    ▶️
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div className='text-xs text-gray-400 text-center'>
                        {new Date(session.timestamp).toLocaleString()}
                    </div>
                </div>
            ))}
            <div ref={chatEndRef}></div>
        </div>
    );
}
