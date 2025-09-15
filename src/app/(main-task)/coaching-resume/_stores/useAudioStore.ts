// src/app/(main-task)/coaching-resume/_stores/useAudioStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChatSession, SpeakerSegment } from '@/apis/recoding-api';

interface AudioState {
    // 현재 재생 상태
    currentSession: ChatSession | null;
    currentSegment: SpeakerSegment | null;
    playingSegment: SpeakerSegment | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isReady: boolean;
    isFullSessionMode: boolean;

    // 재생 히스토리 (최근 재생한 세션들)
    recentSessions: ChatSession[];
    favoriteSessions: ChatSession[];

    // 재생 설정
    volume: number;
    playbackRate: number;
    autoPlay: boolean;
    loopMode: 'none' | 'session' | 'segment';

    // 액션들
    setCurrentSession: (session: ChatSession | null) => void;
    setCurrentSegment: (segment: SpeakerSegment | null) => void;
    setPlayingSegment: (segment: SpeakerSegment | null) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setIsReady: (ready: boolean) => void;
    setIsFullSessionMode: (mode: boolean) => void;

    // 세션 관리
    addToRecentSessions: (session: ChatSession) => void;
    addToFavorites: (session: ChatSession) => void;
    removeFromFavorites: (sessionId: number) => void;

    // 재생 설정
    setVolume: (volume: number) => void;
    setPlaybackRate: (rate: number) => void;
    setAutoPlay: (autoPlay: boolean) => void;
    setLoopMode: (mode: 'none' | 'session' | 'segment') => void;

    // 유틸리티
    reset: () => void;
    prepareAudio: (session: ChatSession) => void;
    playSegment: (segment: SpeakerSegment, session: ChatSession) => void;
    playFullSession: (session: ChatSession) => void;
}

export const useAudioStore = create<AudioState>()(
    persist<AudioState>(
        (set, get) => ({
            // 초기 상태
            currentSession: null,
            currentSegment: null,
            playingSegment: null,
            currentTime: 0,
            duration: 0,
            isPlaying: false,
            isReady: false,
            isFullSessionMode: false,

            // 히스토리
            recentSessions: [],
            favoriteSessions: [],

            // 설정
            volume: 1.0,
            playbackRate: 1.0,
            autoPlay: false,
            loopMode: 'none',

            // 기본 액션들
            setCurrentSession: (session) => set({ currentSession: session }),
            setCurrentSegment: (segment) => set({ currentSegment: segment }),
            setPlayingSegment: (segment) => set({ playingSegment: segment }),
            setCurrentTime: (time) => set({ currentTime: time }),
            setDuration: (duration) => set({ duration: duration }),
            setIsPlaying: (playing) => set({ isPlaying: playing }),
            setIsReady: (ready) => set({ isReady: ready }),
            setIsFullSessionMode: (mode) => set({ isFullSessionMode: mode }),

            // 세션 관리
            addToRecentSessions: (session) => {
                const { recentSessions } = get();
                const filtered = recentSessions.filter((s) => s.sessionIdx !== session.sessionIdx);
                const updated = [session, ...filtered].slice(0, 10); // 최대 10개
                set({ recentSessions: updated });
            },

            addToFavorites: (session) => {
                const { favoriteSessions } = get();
                const exists = favoriteSessions.some((s) => s.sessionIdx === session.sessionIdx);
                if (!exists) {
                    set({ favoriteSessions: [...favoriteSessions, session] });
                }
            },

            removeFromFavorites: (sessionId) => {
                const { favoriteSessions } = get();
                set({
                    favoriteSessions: favoriteSessions.filter((s) => s.sessionIdx !== sessionId),
                });
            },

            // 재생 설정
            setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
            setPlaybackRate: (rate) => set({ playbackRate: Math.max(0.5, Math.min(2, rate)) }),
            setAutoPlay: (autoPlay) => set({ autoPlay }),
            setLoopMode: (mode) => set({ loopMode: mode }),

            // 유틸리티
            reset: () =>
                set({
                    currentSession: null,
                    currentSegment: null,
                    playingSegment: null,
                    currentTime: 0,
                    duration: 0,
                    isPlaying: false,
                    isReady: false,
                    isFullSessionMode: false,
                }),

            // 오디오 준비 (음성메모 선택 시)
            prepareAudio: (session) => {
                set({
                    currentSession: session,
                    isFullSessionMode: true,
                    playingSegment: null,
                    currentSegment: null,
                    currentTime: 0,
                    isPlaying: false,
                    isReady: true,
                });
                get().addToRecentSessions(session);
            },

            // 세그먼트 재생 (STT 타임라인 클릭 시)
            playSegment: (segment, session) => {
                set({
                    playingSegment: segment,
                    currentSession: session,
                    currentSegment: segment,
                    isFullSessionMode: false,
                    isReady: true,
                });
                get().addToRecentSessions(session);
            },

            // 전체 세션 재생 (재생 버튼 클릭 시)
            playFullSession: (session) => {
                set({
                    currentSession: session,
                    isFullSessionMode: true,
                    playingSegment: null,
                    currentSegment: null,
                    isReady: true,
                });
                get().addToRecentSessions(session);
            },
        }),
        {
            name: 'audio-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) =>
                ({
                    recentSessions: state.recentSessions,
                    favoriteSessions: state.favoriteSessions,
                    volume: state.volume,
                    playbackRate: state.playbackRate,
                    autoPlay: state.autoPlay,
                    loopMode: state.loopMode,
                }) as any,
        },
    ) as any,
);

export default useAudioStore;
