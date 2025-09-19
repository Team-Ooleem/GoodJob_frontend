'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '../_stores/useAudioStore';

export function useAudioPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Zustand 스토어에서 상태 가져오기
    const {
        currentSession,
        currentSegment,
        playingSegment,
        currentTime,
        duration,
        isPlaying,
        setSeekToTime,
        seekToTime,
        isReady,
        isFullSessionMode,
        volume,
        playbackRate,
        loopMode,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        setIsReady,
        setCurrentSegment,
        setPlayingSegment,
        prepareAudio,
        playSegment,
        playFullSession,
        reset,
        setCurrentSession,
        setVolume,
        recentSessions,
    } = useAudioStore();

    // 오디오 엘리먼트 설정
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.playbackRate = playbackRate;
        }
    }, [volume, playbackRate]);

    // 안전한 오디오 재생 함수
    const safePlay = useCallback(
        async (audio: HTMLAudioElement) => {
            try {
                // 이미 재생 중이면 일시정지하지 않고 그대로 재생
                if (!audio.paused) {
                    // 이미 재생 중이므로 그대로 두고 상태만 업데이트
                    setIsPlaying(true);
                    return;
                }

                // 정지 상태에서만 재생 시작
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Audio play error:', error);
                }
            }
        },
        [setIsPlaying],
    );

    // 재생/정지 토글
    const togglePlayPause = useCallback(async () => {
        if (!audioRef.current || !currentSession) return;

        try {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                await safePlay(audioRef.current);
            }
        } catch (error) {
            console.error('Toggle play/pause error:', error);
        }
    }, [isPlaying, currentSession, safePlay, setIsPlaying]);

    // 오디오 정지
    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        reset();
    }, [reset]);

    // 시간 이동 (진행바 클릭, 10초 앞/뒤)
    const seekTo = useCallback(
        (time: number) => {
            if (!audioRef.current) return;

            const clampedTime = Math.max(0, Math.min(duration, time));
            audioRef.current.currentTime = clampedTime;
            setCurrentTime(clampedTime);
        },
        [duration, setCurrentTime],
    );

    // 세그먼트 클릭으로 해당 시간으로 이동 (게이지 바 클릭과 동일한 방식)
    const handleSegmentClick = useCallback(
        (segment: any, session?: any) => {
            if (!session) return;

            console.log('🎯 handleSegmentClick called:', { segment, session });

            // 게이지 바 클릭과 동일하게 시간 이동만 수행
            if (audioRef.current && duration > 0) {
                console.log('🎯 Audio element found, seeking to:', segment.startTime);

                // handleProgressClick과 완전히 동일한 로직
                const newTime = segment.startTime;
                const clampedTime = Math.max(0, Math.min(duration, newTime));
                audioRef.current.currentTime = clampedTime;
                setCurrentTime(clampedTime);

                // 재생 상태는 유지 (게이지 바 클릭과 동일)
                // safePlay 호출하지 않음!
            } else {
                console.log('🎯 No audio element or duration, updating state only');
                setCurrentTime(segment.startTime);
            }
        },
        [duration, setCurrentTime],
    );

    // 시간 업데이트 (세그먼트별 자동 정지 포함) - 물 흐르듯 부드러운 애니메이션
    const handleTimeUpdate = useCallback(
        (e: React.SyntheticEvent<HTMLAudioElement>) => {
            const audio = e.currentTarget;
            const time = audio.currentTime;

            // 🎯 requestAnimationFrame을 사용하여 부드러운 업데이트
            requestAnimationFrame(() => {
                setCurrentTime(time);
            });

            // 세그먼트 모드에서 현재 세그먼트가 끝나면 자동 정지
            if (!isFullSessionMode && currentSegment) {
                if (time >= currentSegment.endTime) {
                    audio.pause();
                    setIsPlaying(false);

                    // 루프 모드에 따른 처리
                    if (loopMode === 'segment') {
                        audio.currentTime = currentSegment.startTime;
                        setTimeout(() => safePlay(audio), 100);
                    }
                }
            }
        },
        [isFullSessionMode, currentSegment, setCurrentTime, setIsPlaying, loopMode, safePlay],
    );

    // 오디오 종료 (전체 세션 모드에서 끝나면 처음으로)
    const handleAudioEnd = useCallback(() => {
        if (isFullSessionMode) {
            if (loopMode === 'session') {
                // 세션 루프: 처음으로 돌아가서 재생
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    setTimeout(() => safePlay(audioRef.current!), 100);
                }
            } else {
                // 일반 모드: 처음으로 돌아가서 준비 상태
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                }
                setCurrentTime(0);
                setIsPlaying(false);
            }
        } else {
            // 세그먼트 모드: 정지
            setIsPlaying(false);
        }
    }, [isFullSessionMode, loopMode, setCurrentTime, setIsPlaying, safePlay]);

    // 오디오 메타데이터 로드 완료
    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
            setIsReady(true);
        }
    }, [setDuration, setIsReady]);

    // 오디오 소스 생성
    const getAudioSources = useCallback((audioUrl: string) => {
        if (!audioUrl) return [];
        const extension = audioUrl.split('.').pop()?.toLowerCase() || '';
        switch (extension) {
            case 'webm':
                return [{ src: audioUrl, type: 'audio/webm' }];
            case 'mp4':
                return [{ src: audioUrl, type: 'audio/mp4' }];
            case 'flac':
                return [{ src: audioUrl, type: 'audio/flac' }];
            case 'mp3':
                return [{ src: audioUrl, type: 'audio/mpeg' }];
            default:
                return [{ src: audioUrl, type: 'audio/mp4' }];
        }
    }, []);

    return {
        // 상태
        currentSession,
        currentSegment,
        playingSegment,
        currentTime,
        duration,
        isPlaying,
        isReady,
        isFullSessionMode,
        audioRef,
        volume,
        recentSessions,
        setSeekToTime,
        seekToTime,

        // 함수들
        prepareAudio,
        playSegment,
        playFullSession,
        togglePlayPause,
        stopAudio,
        handleTimeUpdate,
        handleAudioEnd,
        handleLoadedMetadata,
        getAudioSources,
        seekTo,
        safePlay,
        setCurrentTime,
        setDuration,
        handleSegmentClick,

        // 추가 함수들
        setCurrentSession,
        setCurrentSegment,
        setPlayingSegment,
        setVolume,
        setIsPlaying,
    };
}

export default useAudioPlayer;
