import { useState, useRef } from 'react';
import { api } from '@/apis/api';
import { speakSync, type SpeakSyncResponse } from '@/apis/avatar-api';

/**
 * TTS(Text-to-Speech) 관리를 위한 커스텀 훅
 * 음성 합성, 아바타 비디오, 말하기 상태 등을 관리
 */
export const useTTSManager = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
    const isSpeakingRef = useRef(false);
    const lastSpokenQuestionRef = useRef<string | null>(null);
    const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const logAxiosBlobError = async (ctx: string, err: any) => {
        try {
            const status = err?.response?.status;
            const headers = err?.response?.headers;
            const data = err?.response?.data;
            if (data instanceof Blob) {
                const ct = data.type || headers?.['content-type'] || '';
                if (ct.includes('application/json') || ct.includes('text/')) {
                    const text = await data.text();
                    console.error(`[${ctx}] 서버 오류 본문(${status}):`, text);
                } else {
                    console.error(`[${ctx}] 서버가 Blob(${status}, ${ct})을 반환했습니다.`);
                }
            } else if (data) {
                console.error(`[${ctx}] 오류 응답(${status}):`, data);
            } else {
                console.error(`[${ctx}] 오류:`, err?.message || err);
            }
        } catch (e) {
            console.error(`[${ctx}] 오류 본문 디코딩 실패:`, e);
        }
    };

    const synthesizeSpeech = async (text: string): Promise<string> => {
        try {
            const response = await api.post(
                `tts/synthesize`,
                {
                    text,
                    ...(process.env.NEXT_PUBLIC_TTS_LANGUAGE_CODE
                        ? { languageCode: process.env.NEXT_PUBLIC_TTS_LANGUAGE_CODE }
                        : {}),
                    ...(process.env.NEXT_PUBLIC_TTS_VOICE_NAME
                        ? { voiceName: process.env.NEXT_PUBLIC_TTS_VOICE_NAME }
                        : { voiceName: 'ko-KR-Chirp3-HD-Charon' }),
                    ...(process.env.NEXT_PUBLIC_TTS_AUDIO_ENCODING
                        ? { audioEncoding: process.env.NEXT_PUBLIC_TTS_AUDIO_ENCODING }
                        : { audioEncoding: 'MP3' }),
                },
                {
                    timeout: 30000,
                    responseType: 'blob',
                },
            );

            const audioUrl = URL.createObjectURL(response.data);
            return audioUrl;
        } catch (error: any) {
            console.error('TTS 요청 실패:', error);
            await logAxiosBlobError('TTS', error);

            try {
                const fallbackVoice =
                    process.env.NEXT_PUBLIC_TTS_FALLBACK_VOICE_NAME || 'ko-KR-Chirp3-HD-Charon';
                const response2 = await api.post(
                    `tts/synthesize`,
                    {
                        text,
                        languageCode: process.env.NEXT_PUBLIC_TTS_LANGUAGE_CODE || 'ko-KR',
                        voiceName: fallbackVoice,
                        audioEncoding: process.env.NEXT_PUBLIC_TTS_AUDIO_ENCODING || 'MP3',
                    },
                    { timeout: 30000, responseType: 'blob' },
                );
                const audioUrl2 = URL.createObjectURL(response2.data);
                console.warn('TTS 재시도: 표준 보이스로 성공', fallbackVoice);
                return audioUrl2;
            } catch (retryErr) {
                await logAxiosBlobError('TTS(retry)', retryErr);
                throw error;
            }
        }
    };

    const simulateAISpeaking = (duration: number = 3000) => {
        setIsSpeaking(true);
        if (speakingTimerRef.current) {
            clearTimeout(speakingTimerRef.current);
        }
        speakingTimerRef.current = setTimeout(() => {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
        }, duration);
    };

    const speakQuestion = async (text: string, questionId: string) => {
        if (isSpeakingRef.current || lastSpokenQuestionRef.current === questionId) {
            return;
        }

        const useTalkingAvatar = process.env.NEXT_PUBLIC_TALKING_AVATAR === 'true';
        const defaultAvatarId = process.env.NEXT_PUBLIC_DEFAULT_AVATAR_ID;

        isSpeakingRef.current = true;
        setIsSpeaking(true);
        lastSpokenQuestionRef.current = questionId;

        try {
            if (useTalkingAvatar && defaultAvatarId) {
                try {
                    const res: SpeakSyncResponse = await speakSync({
                        avatarId: defaultAvatarId,
                        text: text,
                        resolution: 256,
                        stillMode: true,
                    });
                    if (res?.success) {
                        setAvatarVideoUrl(res.videoUrl);
                        return;
                    }
                } catch (e) {
                    console.warn('아바타 TTS 실패, 음성 TTS로 폴백');
                }
            }

            const audioUrl = await synthesizeSpeech(text);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (error) {
            console.error('TTS 실패:', error);
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            simulateAISpeaking(3000);
        }
    };

    const onAvatarEnded = () => {
        setAvatarVideoUrl(null);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
    };

    const cleanup = () => {
        if (speakingTimerRef.current) {
            clearTimeout(speakingTimerRef.current);
        }
    };

    return {
        isSpeaking,
        avatarVideoUrl,
        speakQuestion,
        onAvatarEnded,
        simulateAISpeaking,
        cleanup,
        isSpeakingRef,
    };
};
