'use client';

import { useCallback } from 'react';
import { useRecordingStore } from '../_stores/useRecordingStore';
import { useAudioMetadata } from './useAudioMetadata';

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

export const useAudioLoading = () => {
    const { setIsLoadingAudio } = useRecordingStore();
    const { loadAudioMetadata } = useAudioMetadata();

    const loadAudioWithDuration = useCallback(
        async (
            audioUrl: string,
            session: ChatSession,
            audioRef: React.RefObject<HTMLAudioElement>,
            setDuration: (duration: number) => void,
        ) => {
            setIsLoadingAudio(true);

            try {
                const audioDuration = await loadAudioMetadata(audioUrl);
                setDuration(audioDuration);

                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                    audioRef.current.preload = 'auto';
                    audioRef.current.load();
                }

                return audioDuration;
            } catch (error) {
                console.warn('Failed to load audio metadata:', error);
                const fallbackDuration = Math.max(...session.segments.map((s) => s.endTime));
                setDuration(fallbackDuration);
                return fallbackDuration;
            } finally {
                setIsLoadingAudio(false);
            }
        },
        [loadAudioMetadata, setIsLoadingAudio],
    );

    return { loadAudioWithDuration };
};
