'use client';

import { useCallback } from 'react';

// 전역 캐시
const audioMetadataCache = new Map<string, { duration: number; loaded: boolean }>();

export const useAudioMetadata = () => {
    const loadAudioMetadata = useCallback(async (audioUrl: string): Promise<number> => {
        // 캐시에서 먼저 확인
        const cached = audioMetadataCache.get(audioUrl);
        if (cached?.loaded) {
            console.log('Using cached audio duration:', cached.duration);
            return cached.duration;
        }

        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.crossOrigin = 'anonymous';

            const timeout = setTimeout(() => {
                reject(new Error('Audio metadata load timeout'));
            }, 10000);

            const handleLoadedMetadata = () => {
                clearTimeout(timeout);
                const duration = audio.duration;

                if (duration && isFinite(duration) && duration > 0 && duration !== Infinity) {
                    audioMetadataCache.set(audioUrl, { duration, loaded: true });
                    resolve(duration);
                } else {
                    reject(new Error('Invalid audio duration'));
                }

                audio.src = '';
                audio.load();
            };

            const handleError = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load audio metadata'));
            };

            audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            audio.addEventListener('error', handleError, { once: true });

            audio.src = audioUrl;
        });
    }, []);

    return { loadAudioMetadata };
};
