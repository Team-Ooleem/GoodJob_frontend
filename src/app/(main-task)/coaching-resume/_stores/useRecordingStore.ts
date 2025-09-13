'use client';

import { create } from 'zustand';
import { ChatSession, RecordingItem } from '@/apis/Recording-api';

interface RecordingState {
    // 상태
    sessions: ChatSession[];
    selectedRecording: RecordingItem | null;
    loading: boolean;
    error: string | null;
    page: number;
    isLoadingAudio: boolean;

    // 액션
    setSessions: (sessions: ChatSession[]) => void;
    setSelectedRecording: (recording: RecordingItem | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setPage: (page: number) => void;
    setIsLoadingAudio: (loading: boolean) => void;
    addSessions: (sessions: ChatSession[]) => void;
    incrementPage: () => void;
    reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
    // 초기 상태
    sessions: [],
    selectedRecording: null,
    loading: false,
    error: null,
    page: 1,
    isLoadingAudio: false,

    // 액션들
    setSessions: (sessions) => set({ sessions }),
    setSelectedRecording: (selectedRecording) => set({ selectedRecording }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setPage: (page) => set({ page }),
    setIsLoadingAudio: (isLoadingAudio) => set({ isLoadingAudio }),
    addSessions: (newSessions) =>
        set((state) => ({
            sessions: [...state.sessions, ...newSessions],
        })),
    incrementPage: () => set((state) => ({ page: state.page + 1 })),
    reset: () =>
        set({
            sessions: [],
            selectedRecording: null,
            loading: false,
            error: null,
            page: 1,
            isLoadingAudio: false,
        }),
}));
