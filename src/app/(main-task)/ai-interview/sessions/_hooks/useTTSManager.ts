import { useState, useRef } from 'react';
import { api } from '@/apis/api';

/**
 * TTS(Text-to-Speech) 관리를 위한 커스텀 훅
 * 음성 합성, 아바타 비디오, 말하기 상태 등을 관리
 */
export const useTTSManager = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
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

    const speakQuestion = async (text: string, questionId: string, onComplete?: () => void) => {
        if (isSpeakingRef.current || lastSpokenQuestionRef.current === questionId) {
            return;
        }

        isSpeakingRef.current = true;
        setIsSpeaking(true);
        lastSpokenQuestionRef.current = questionId;

        try {
            const audioUrl = await synthesizeSpeech(text);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                URL.revokeObjectURL(audioUrl);
                onComplete?.(); // TTS 완료 콜백 호출
            };

            audio.onerror = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
                URL.revokeObjectURL(audioUrl);
                onComplete?.(); // 에러 시에도 콜백 호출
            };

            await audio.play();
        } catch (error) {
            console.error('TTS 실패:', error);
            setIsSpeaking(false);
            isSpeakingRef.current = false;
            simulateAISpeaking(3000);
            onComplete?.(); // 실패 시에도 콜백 호출
        }
    };

    const cleanup = () => {
        if (speakingTimerRef.current) {
            clearTimeout(speakingTimerRef.current);
        }
    };

    return {
        isSpeaking,
        speakQuestion,
        simulateAISpeaking,
        cleanup,
        isSpeakingRef,
    };
};
