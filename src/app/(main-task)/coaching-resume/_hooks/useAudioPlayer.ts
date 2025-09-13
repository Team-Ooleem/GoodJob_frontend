'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatSession, SpeakerSegment, RecordingItem, TranscriptItem } from '@/apis/Recording-api';

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

    // 안전한 오디오 재생 함수
    const safePlay = useCallback(async (audio: HTMLAudioElement) => {
        try {
            // 현재 재생 중인 오디오가 있다면 먼저 정지
            if (!audio.paused) {
                audio.pause();
                // pause 후 잠시 대기
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
            await audio.play();
        } catch (error) {
            // AbortError는 무시 (사용자 경험에 영향 없음)
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Audio play error:', error);
            }
        }
    }, []);

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

                // 실제 오디오 파일의 전체 길이 사용
                setCurrentTime(absoluteTime);

                // duration이 아직 설정되지 않았다면 설정
                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    setDuration(audio.duration);
                }

                // 전체 세션이 끝나면 정지
                if (audio.ended) {
                    handleAudioEnd();
                    return;
                }
            } else {
                // 개별 세그먼트 모드
                if (currentSegment) {
                    const segmentStartTime = currentSegment.startTime;
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
    const playFullSession = useCallback(
        (session: ChatSession) => {
            if (session.segments.length === 0) return;

            setCurrentSession(session);
            setIsFullSessionMode(true);

            // 첫 번째 세그먼트부터 시작
            const firstSegment = session.segments[0];
            setPlayingSegment(firstSegment);
            setCurrentSegment(firstSegment);

            if (audioRef.current) {
                audioRef.current.currentTime = 0; // 0초부터 시작 (기존: firstSegment.startTime)
                setIsPlaying(true);
                safePlay(audioRef.current);
            }
        },
        [safePlay],
    );

    const playSegment = useCallback(
        (segment: SpeakerSegment, session: ChatSession) => {
            setPlayingSegment(segment);
            setCurrentSegment(segment);
            setCurrentSession(session);
            setIsFullSessionMode(false);

            if (audioRef.current) {
                // 세그먼트의 정확한 시작 시간으로 이동
                audioRef.current.currentTime = segment.startTime;
                setIsPlaying(true);
                safePlay(audioRef.current);

                // endTime에 도달하면 자동 정지
                const checkEndTime = () => {
                    if (audioRef.current && audioRef.current.currentTime >= segment.endTime) {
                        audioRef.current.pause();
                        setPlayingSegment(null);
                        setIsPlaying(false);
                    } else {
                        requestAnimationFrame(checkEndTime);
                    }
                };
                checkEndTime();
            }
        },
        [safePlay],
    );

    const stopAudio = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioRef.current) {
            // pause 전에 현재 재생 상태 확인
            if (!audioRef.current.paused) {
                audioRef.current.pause();
            }
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
            case 'wav':
                return [{ src: audioUrl, type: 'audio/wav' }];
            case 'webm':
                return [{ src: audioUrl, type: 'audio/webm' }];
            case 'mp4':
            case 'flac':
                return [{ src: audioUrl, type: 'audio/flac' }];
            case 'mp3':
                return [{ src: audioUrl, type: 'audio/mpeg' }];
            default:
                return [{ src: audioUrl, type: 'audio/wav' }];
        }
    }, []);

    // 개별 세그먼트 모드에서 오디오 시작 위치 설정
    useEffect(() => {
        if (audioRef.current && currentSegment && !isFullSessionMode) {
            const audio = audioRef.current;

            const handleLoadedMetadata = () => {
                audio.currentTime = currentSegment.startTime;
                setCurrentTime(0);
                setDuration(currentSegment.endTime - currentSegment.startTime);
                setIsPlaying(true);
                safePlay(audio);
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
    }, [currentSegment, isFullSessionMode, safePlay]);

    // 전체 세션 모드에서 오디오 로드 시 처리
    useEffect(() => {
        if (audioRef.current && isFullSessionMode && currentSession) {
            const audio = audioRef.current;

            // WebM 파일의 경우 더 정교한 로딩 처리
            const loadAudioDuration = async () => {
                try {
                    // 오디오를 완전히 로드할 때까지 대기 (타임아웃 증가)
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Audio load timeout'));
                        }, 30000); // 30초로 증가

                        const checkDuration = () => {
                            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                                clearTimeout(timeout);
                                resolve(audio.duration);
                            } else if (audio.readyState >= 2) {
                                // HAVE_CURRENT_DATA
                                // WebM 파일의 경우 readyState가 2일 때도 duration이 있을 수 있음
                                setTimeout(checkDuration, 200); // 체크 간격 증가
                            } else {
                                setTimeout(checkDuration, 200);
                            }
                        };

                        checkDuration();
                    });

                    // 실제 duration 설정
                    if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                        setDuration(audio.duration);
                        console.log('WebM Audio duration loaded:', audio.duration);
                    } else {
                        throw new Error('Duration not available');
                    }
                } catch (error) {
                    console.warn('Failed to load audio duration, using fallback:', error);
                    // fallback: 세그먼트 기반 duration 사용
                    const fallbackDuration = Math.max(
                        ...currentSession.segments.map((s) => s.endTime),
                    );
                    setDuration(fallbackDuration);
                    console.log('Using fallback duration:', fallbackDuration);
                }
            };

            const handleLoadedMetadata = () => {
                console.log(
                    'loadedmetadata event fired, readyState:',
                    audio.readyState,
                    'duration:',
                    audio.duration,
                );

                // WebM 파일의 경우 loadedmetadata에서 duration이 제대로 설정되지 않을 수 있음
                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    setDuration(audio.duration);
                    console.log('Duration from loadedmetadata:', audio.duration);
                    // Duration이 로드되면 재생 준비 완료
                    setIsPlaying(false); // 재생 버튼 활성화 (일시정지 상태)
                } else {
                    // 비동기로 duration 로드 시도
                    loadAudioDuration()
                        .then(() => {
                            setIsPlaying(false); // 재생 버튼 활성화 (일시정지 상태)
                        })
                        .catch(() => {
                            // fallback duration이라도 재생 준비 완료
                            setIsPlaying(false);
                        });
                }
                audio.currentTime = 0; // 0초부터 시작
                setCurrentTime(0); // 0초부터 시작
                safePlay(audio);
            };

            const handleCanPlayThrough = () => {
                console.log(
                    'canplaythrough event fired, readyState:',
                    audio.readyState,
                    'duration:',
                    audio.duration,
                );

                // canplaythrough에서도 duration 확인
                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    setDuration(audio.duration);
                    console.log('Duration from canplaythrough:', audio.duration);
                    setIsPlaying(false); // 재생 버튼 활성화 (일시정지 상태)
                } else {
                    loadAudioDuration()
                        .then(() => {
                            setIsPlaying(false); // 재생 버튼 활성화 (일시정지 상태)
                        })
                        .catch(() => {
                            // fallback duration이라도 재생 준비 완료
                            setIsPlaying(false);
                        });
                }
            };

            const handleDurationChange = () => {
                console.log('durationchange event fired, duration:', audio.duration);

                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    setDuration(audio.duration);
                    console.log('Duration from durationchange:', audio.duration);
                    setIsPlaying(false); // 재생 버튼 활성화 (일시정지 상태)
                }
            };

            const handleLoadedData = () => {
                console.log(
                    'loadeddata event fired, readyState:',
                    audio.readyState,
                    'duration:',
                    audio.duration,
                );

                if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                    setDuration(audio.duration);
                    console.log('Duration from loadeddata:', audio.duration);
                    setIsPlaying(false); // 재생 버튼 활성화 (일시정지 상태)
                }
            };

            // WebM 파일의 경우 preload를 auto로 설정하여 더 많은 데이터 로드
            audio.preload = 'auto';

            if (audio.readyState >= 1) {
                handleLoadedMetadata();
            } else {
                audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
                audio.addEventListener('canplaythrough', handleCanPlayThrough, { once: true });
                audio.addEventListener('durationchange', handleDurationChange, { once: true });
                audio.addEventListener('loadeddata', handleLoadedData, { once: true });
            }

            return () => {
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('canplaythrough', handleCanPlayThrough);
                audio.removeEventListener('durationchange', handleDurationChange);
                audio.removeEventListener('loadeddata', handleLoadedData);
            };
        }
    }, [isFullSessionMode, currentSession, safePlay]);

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
        safePlay,

        setCurrentSession,
        setPlayingSegment,
        setCurrentSegment,
        setIsFullSessionMode,
        setIsPlaying,
        setCurrentTime, // 추가
        setDuration, // 추가
    };
}

export default useAudioPlayer;
