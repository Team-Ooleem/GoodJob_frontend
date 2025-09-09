import { api } from './api';

export interface SpeakSyncRequest {
    avatarId: string;
    text: string;
    resolution?: 256 | 512;
    stillMode?: boolean;
    enhance?: boolean;
    tts?: {
        voiceName?: string;
        rate?: number;
    };
}

export interface SpeakSyncSuccessResponse {
    success: true;
    videoUrl: string;
    duration: number;
    meta?: Record<string, any>;
}

export interface SpeakSyncFallbackResponse {
    success: false;
    fallback?: 'tts';
    error?: string;
}

export type SpeakSyncResponse = SpeakSyncSuccessResponse | SpeakSyncFallbackResponse;

export async function speakSync(payload: SpeakSyncRequest): Promise<SpeakSyncResponse> {
    const res = await api.post('/avatar/speak-sync', payload, { timeout: 30000 });
    return res.data as SpeakSyncResponse;
}

