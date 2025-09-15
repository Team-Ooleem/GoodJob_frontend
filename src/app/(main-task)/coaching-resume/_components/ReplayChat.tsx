'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Spin, Empty } from 'antd';

import { API_BASE_URL } from '@/constants/config';
import { useAudioPlayer } from '../_hooks/useAudioPlayer';
import { ChatSession, SpeakerSegment } from '@/apis/recoding-api';
import AudioPlayer from './AudioPlayer';

interface ReplayChatProps {
    canvasIdx: number;
    isOpen: boolean;
    currentUserId?: number;
}

export function ReplayChat({ canvasIdx, isOpen, currentUserId }: ReplayChatProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // useAudioPlayer 훅 사용
    const {
        currentSession,
        currentSegment,
        playingSegment,
        isPlaying,
        prepareAudio,
        handleSegmentClick: audioHandleSegmentClick,
        stopAudio,
    } = useAudioPlayer();

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
        return actualUserId === currentUserId ? 0 : 1;
    };

    // 세션 데이터 로드
    const loadSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/chat/sessions/${canvasIdx}`);
            setSessions(response.data);
        } catch (err) {
            setError('세션 데이터를 불러오는데 실패했습니다.');
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    // 세그먼트 클릭 핸들러 - useAudioPlayer의 handleSegmentClick 사용
    const handleSegmentClick = (segment: SpeakerSegment, session: ChatSession) => {
        // 세션을 prepareAudio로 준비
        prepareAudio(session);
        // 세그먼트 클릭 처리 (startTime으로 이동하여 재생)
        audioHandleSegmentClick(segment, session);
    };

    // 세션 선택 핸들러
    const handleSessionSelect = (session: ChatSession) => {
        prepareAudio(session);
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (isOpen) {
            loadSessions();
        }
    }, [isOpen, canvasIdx]);

    // 컴포넌트 언마운트 시 오디오 정리
    useEffect(() => {
        return () => {
            if (isOpen) {
                stopAudio();
            }
        };
    }, [isOpen, stopAudio]);

    const closeReplay = () => {
        stopAudio();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* AudioPlayer 컴포넌트 렌더링 */}
            <div className='fixed bottom-4 left-4 right-4 z-[60]'>
                <AudioPlayer />
            </div>

            {/* ReplayChat 팝업 */}
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                <div className='bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] max-w-6xl flex flex-col'>
                    {/* 헤더 */}
                    <div className='flex justify-between items-center p-4 border-b'>
                        <h2 className='text-xl font-semibold'>채팅 재생</h2>
                        <Button onClick={closeReplay}>닫기</Button>
                    </div>

                    {/* 콘텐츠 */}
                    <div className='flex-1 overflow-hidden flex'>
                        {/* 세션 목록 */}
                        <div className='w-1/3 border-r overflow-y-auto'>
                            <div className='p-4'>
                                <h3 className='font-semibold mb-3'>세션 목록</h3>
                                {loading ? (
                                    <Spin />
                                ) : error ? (
                                    <div className='text-red-500'>{error}</div>
                                ) : sessions.length === 0 ? (
                                    <Empty description='세션이 없습니다' />
                                ) : (
                                    <div className='space-y-2'>
                                        {sessions.map((session) => (
                                            <div
                                                key={session.sessionIdx}
                                                className={`p-3 border rounded cursor-pointer transition-colors ${
                                                    currentSession?.sessionIdx ===
                                                    session.sessionIdx
                                                        ? 'bg-blue-50 border-blue-300'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() => handleSessionSelect(session)}
                                            >
                                                <div className='font-medium'>
                                                    세션 {session.sessionIdx}
                                                </div>
                                                <div className='text-sm text-gray-500'>
                                                    {new Date(session.timestamp).toLocaleString()}
                                                </div>
                                                <div className='text-sm text-gray-500'>
                                                    {session.segments.length}개 세그먼트
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 채팅 내용 */}
                        <div className='flex-1 flex flex-col'>
                            {currentSession ? (
                                <>
                                    {/* 세션 정보 */}
                                    <div className='p-4 border-b bg-gray-50'>
                                        <h3 className='font-semibold'>
                                            세션 {currentSession.sessionIdx}
                                        </h3>
                                        <div className='text-sm text-gray-600'>
                                            {new Date(currentSession.timestamp).toLocaleString()}
                                        </div>
                                        {isPlaying && (
                                            <div className='text-sm text-green-600 mt-1'>
                                                🎵 재생 중...
                                            </div>
                                        )}
                                    </div>

                                    {/* 채팅 메시지 */}
                                    <div
                                        className='flex-1 overflow-y-auto p-4 space-y-3'
                                        ref={chatEndRef}
                                    >
                                        {currentSession.segments.map((segment, index) => {
                                            const normalizedTag = getNormalizedSpeakerTag(
                                                segment,
                                                currentSession,
                                            );
                                            const isCurrentUser = normalizedTag === 0;
                                            const isPlayingSegment =
                                                playingSegment?.startTime === segment.startTime;
                                            const isCurrentSegment =
                                                currentSegment?.startTime === segment.startTime;

                                            return (
                                                <div
                                                    key={index}
                                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] p-3 rounded-lg cursor-pointer transition-all ${
                                                            isCurrentUser
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-200 text-gray-800'
                                                        } ${
                                                            isPlayingSegment
                                                                ? 'ring-2 ring-yellow-400 bg-yellow-100'
                                                                : isCurrentSegment
                                                                  ? 'ring-2 ring-blue-400'
                                                                  : 'hover:shadow-md'
                                                        }`}
                                                        onClick={() =>
                                                            handleSegmentClick(
                                                                segment,
                                                                currentSession,
                                                            )
                                                        }
                                                    >
                                                        <div className='text-sm font-medium mb-1'>
                                                            {isCurrentUser ? '나' : '상대방'}
                                                        </div>
                                                        <div className='text-sm'>
                                                            {segment.textContent}
                                                        </div>
                                                        <div className='text-xs opacity-70 mt-1'>
                                                            {Math.floor(segment.startTime / 60)}:
                                                            {Math.floor(segment.startTime % 60)
                                                                .toString()
                                                                .padStart(2, '0')}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* 플레이어 상태 표시 */}
                                    {currentSegment && (
                                        <div className='p-4 border-t bg-gray-50'>
                                            <div className='text-sm text-gray-600 mb-2'>
                                                현재 재생:{' '}
                                                {currentSegment.textContent.substring(0, 50)}...
                                            </div>
                                            <div className='text-xs text-gray-500'>
                                                AudioPlayer에서 재생 중입니다.
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className='flex-1 flex items-center justify-center'>
                                    <Empty description='세션을 선택해주세요' />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
