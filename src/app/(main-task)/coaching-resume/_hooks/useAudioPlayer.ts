'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

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
    segmentIndex: number;
}

export function useAudioPlayer() {
    const [playingSegment, setPlayingSegment] = useState<SpeakerSegment | null>(null);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [currentSegment, setCurrentSegment] = useState<SpeakerSegment | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullSessionMode, setIsFullSessionMode] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastUpdateTime = useRef<number>(0);

    // 성능 최적화: 업데이트 빈도 제한 (100ms마다 업데이트)
    const updateTime = useCallback(() => {
        const now = Date.now();
        if (now - lastUpdateTime.current < 100) {
            animationFrameRef.current = requestAnimationFrame(updateTime);
            return;
        }
        lastUpdateTime.current = now;

        if (audioRef.current && isPlaying && currentSession) {
            const audio = audioRef.current;
            const absoluteTime = audio.currentTime;

            if (isFullSessionMode) {
                // 전체 세션 모드: 현재 재생 중인 세그먼트를 찾아서 업데이트
                const currentSegment = currentSession.segments.find(
                    (seg) => absoluteTime >= seg.startTime && absoluteTime <= seg.endTime,
                );

                if (currentSegment && currentSegment !== playingSegment) {
                    setPlayingSegment(currentSegment);
                    setCurrentSegment(currentSegment);
                }

                // 전체 세션의 총 길이로 duration 설정
                const totalDuration = Math.max(...currentSession.segments.map((s) => s.endTime));
                setCurrentTime(absoluteTime);
                setDuration(totalDuration);

                // 전체 세션이 끝나면 정지
                if (audio.currentTime >= totalDuration) {
                    audio.pause();
                    handleAudioEnd();
                    return;
                }
            } else {
                // 기존 세그먼트 모드
                if (currentSegment) {
                    const segmentStartTime = currentSegment.startTime - 0.5;
                    const relativeTime = Math.max(0, absoluteTime - segmentStartTime);
                    const segmentDuration = currentSegment.endTime - segmentStartTime;

                    setCurrentTime(relativeTime);
                    setDuration(segmentDuration);

                    if (audio.currentTime >= currentSegment.endTime) {
                        audio.pause();
                        handleAudioEnd();
                        return;
                    }
                }
            }

            animationFrameRef.current = requestAnimationFrame(updateTime);
        }
    }, [isPlaying, currentSegment, currentSession, isFullSessionMode, playingSegment]);

    const handleAudioEnd = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setPlayingSegment(null);
        setCurrentSegment(null);
        setCurrentSession(null);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setIsFullSessionMode(false);
        if (audioRef.current) {
            audioRef.current = null;
        }
    }, []);

    // 전체 세션 재생 함수
    const playFullSession = useCallback((session: ChatSession) => {
        if (session.segments.length === 0) return;

        setCurrentSession(session);
        setIsFullSessionMode(true);
        setPlayingSegment(session.segments[0]);
        setCurrentSegment(session.segments[0]);

        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            setIsPlaying(true);
            audioRef.current.play().catch(console.error);
        }
    }, []);

    // 기존 세그먼트 재생 함수
    const playSegment = useCallback((segment: SpeakerSegment, session: ChatSession) => {
        setPlayingSegment(segment);
        setCurrentSegment(segment);
        setCurrentSession(session);
        setIsFullSessionMode(false);

        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, segment.startTime - 0.5);
            setIsPlaying(true);
            audioRef.current.play().catch(console.error);
        }
    }, []);

    const stopAudio = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingSegment(null);
        setCurrentSegment(null);
        setCurrentSession(null);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setIsFullSessionMode(false);
    }, []);

    const handleTimeUpdate = useCallback(
        (e: React.SyntheticEvent<HTMLAudioElement>) => {
            const audio = e.currentTarget;
            if (!isPlaying) {
                setIsPlaying(!audio.paused);
            }
        },
        [isPlaying],
    );

    const getAudioSources = useCallback((audioUrl: string) => {
        const extension = audioUrl.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'webm':
                return [{ src: audioUrl, type: 'audio/webm' }];
            case 'mp4':
            case 'm4a':
                return [{ src: audioUrl, type: 'audio/mp4' }];
            case 'wav':
                return [{ src: audioUrl, type: 'audio/wav' }];
            case 'mp3':
                return [{ src: audioUrl, type: 'audio/mpeg' }];
            default:
                return [
                    { src: audioUrl, type: 'audio/webm' },
                    { src: audioUrl, type: 'audio/mp4' },
                    { src: audioUrl, type: 'audio/wav' },
                ];
        }
    }, []);

    // 오디오 시작 위치 설정 및 자동재생
    useEffect(() => {
        if (audioRef.current && currentSegment && !isFullSessionMode) {
            const audio = audioRef.current;

            const handleLoadedMetadata = () => {
                const timeOffset = 0.5;
                const correctedStartTime = Math.max(0, currentSegment.startTime - timeOffset);
                audio.currentTime = correctedStartTime;

                setCurrentTime(0);
                setDuration(currentSegment.endTime - correctedStartTime);
                setIsPlaying(true);

                audio.play().catch(console.error);
            };

            if (audio.readyState >= 1) {
                handleLoadedMetadata();
            } else {
                audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            }

            return () => {
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
        }
    }, [currentSegment, isFullSessionMode]);

    // 전체 세션 모드에서 오디오 로드 시 처리
    useEffect(() => {
        if (audioRef.current && isFullSessionMode && currentSession) {
            const audio = audioRef.current;

            const handleLoadedMetadata = () => {
                const totalDuration = Math.max(...currentSession.segments.map((s) => s.endTime));
                audio.currentTime = 0;
                setCurrentTime(0);
                setDuration(totalDuration);
                setIsPlaying(true);
                audio.play().catch(console.error);
            };

            if (audio.readyState >= 1) {
                handleLoadedMetadata();
            } else {
                audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            }

            return () => {
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            };
        }
    }, [isFullSessionMode, currentSession]);

    // 실시간 시간 업데이트 - 성능 최적화
    useEffect(() => {
        if (isPlaying && audioRef.current && (currentSegment || currentSession)) {
            animationFrameRef.current = requestAnimationFrame(updateTime);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [isPlaying, currentSegment, currentSession, updateTime]);

    // 컴포넌트 언마운트 시 오디오 정리
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return {
        playingSegment,
        currentSession,
        currentSegment,
        currentTime,
        duration,
        isPlaying,
        isFullSessionMode,
        audioRef,
        playSegment,
        playFullSession,
        stopAudio,
        handleTimeUpdate,
        handleAudioEnd,
        getAudioSources,
    };
}
export default useAudioPlayer;
