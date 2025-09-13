'use client';

import { useState, useEffect, useRef } from 'react';
import { Webcam, WebcamHandle, Question, Avatar } from '../_components';
import { message } from 'antd';
import { useInterviewAnalysis } from '@/hooks/use-interview-analysis';
import { blobToBase64, resampleTo16kHzMonoWav } from '@/utils/audio';
import axios from 'axios';
import { api } from '@/apis/api';
import { AI_API_BASE, API_BASE_URL } from '@/constants/config';
import { speakSync, type SpeakSyncResponse } from '@/apis/avatar-api';

// ===== WAV 레코더 유틸 =====
class WavRecorder {
    private audioCtx: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private buffers: Float32Array[] = [];
    private recording = false;
    private stopped = false;

    async start() {
        if (this.recording) return;
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.source = this.audioCtx.createMediaStreamSource(this.stream);
        this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
        this.source.connect(this.processor);
        this.processor.connect(this.audioCtx.destination);

        this.buffers = [];
        this.recording = true;
        this.stopped = false;

        this.processor.onaudioprocess = (e) => {
            if (!this.recording) return;
            const ch0 = e.inputBuffer.getChannelData(0);
            this.buffers.push(new Float32Array(ch0));
        };
    }

    async stop(): Promise<Blob> {
        if (this.stopped) {
            return this.encodeWAV(new Float32Array(0), this.audioCtx?.sampleRate || 44100);
        }
        this.stopped = true;
        this.recording = false;

        try {
            if (this.processor) this.processor.onaudioprocess = null;
        } catch {}
        try {
            if (this.processor) this.processor.disconnect();
        } catch {}
        try {
            if (this.source) this.source.disconnect();
        } catch {}
        try {
            if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
        } catch {}

        const sr = this.audioCtx?.sampleRate || 44100;
        const samples = this.merge(this.buffers);
        const wav = this.encodeWAV(samples, sr);

        try {
            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                await this.audioCtx.close();
            }
        } catch {
        } finally {
            this.audioCtx = null;
            this.stream = null;
            this.source = null;
            this.processor = null;
            this.buffers = [];
        }

        return wav;
    }

    private merge(chunks: Float32Array[]) {
        const total = chunks.reduce((a, b) => a + b.length, 0);
        const out = new Float32Array(total);
        let off = 0;
        for (const c of chunks) {
            out.set(c, off);
            off += c.length;
        }
        return out;
    }

    private encodeWAV(samples: Float32Array, sampleRate: number) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        const writeString = (off: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
        };
        const floatTo16 = (off: number, input: Float32Array) => {
            for (let i = 0; i < input.length; i++, off += 2) {
                let s = Math.max(-1, Math.min(1, input[i]));
                s = s < 0 ? s * 0x8000 : s * 0x7fff;
                view.setInt16(off, s, true);
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        floatTo16(44, samples);

        return new Blob([view], { type: 'audio/wav' });
    }
}

// 더미 면접 데이터
const interviewData = {
    interviewer: {
        name: '정인혜',
        title: '부장·임원',
    },
    questions: [
        '백엔드 개발에서 가장 중요하게 생각하는 기술 스택은 무엇이고, 그 이유는 무엇인가요?',
        '대용량 트래픽을 처리하기 위한 아키텍처 설계 경험이 있나요?',
        '데이터베이스 성능 최적화를 위해 어떤 방법들을 사용해보셨나요?',
    ],
};

type QuestionDto = { id: string; text: string };

interface AudioFeatures {
    f0_mean: number;
    f0_std: number;
    f0_cv?: number;
    f0_std_semitone?: number;
    rms_std: number;
    rms_cv: number;
    rms_cv_voiced?: number;
    rms_db_std_voiced?: number;
    jitter_like: number;
    shimmer_like: number;
    silence_ratio: number;
    sr: number;
    voiced_ratio?: number;
    voiced_frames?: number;
    total_frames?: number;
    voiced_prob_mean?: number;
    voiced_prob_median?: number;
    voiced_prob_p90?: number;
    voiced_flag_ratio?: number;
    voiced_prob_ge_025_ratio?: number;
    voiced_prob_ge_035_ratio?: number;
    f0_valid_ratio?: number;
    silence_ratio_db50?: number;
    voiced_ratio_speech?: number;
    speech_frames?: number | null;
}

interface InterviewSession {
    questionNumber: number;
    question: string;
    answer: string;
    timeSpent: number;
    detectionData: any[];
    timestamp: Date;
    audioUrl?: string;
    audioFeatures?: AudioFeatures;
}

// ===== 질문 관리 훅 =====
const useQuestionManager = () => {
    const [questions, setQuestions] = useState<QuestionDto[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const currentQuestion = questions[currentIndex] || null;
    const hasCurrentQuestion = !!currentQuestion;
    const questionText = currentQuestion?.text || '';
    const questionId = currentQuestion?.id || `q${currentIndex + 1}`;
    const aggregateId = `q${currentIndex + 1}`;

    const addQuestion = (question: QuestionDto) => {
        setQuestions((prev) => [...prev, question]);
    };

    const moveToNext = () => {
        setCurrentIndex((prev) => prev + 1);
    };

    const isLastQuestion = (maxQuestions: number) => {
        return currentIndex >= maxQuestions - 1;
    };

    return {
        questions,
        currentIndex,
        currentQuestion,
        hasCurrentQuestion,
        questionText,
        questionId,
        aggregateId,
        isLoading,
        setIsLoading,
        addQuestion,
        moveToNext,
        isLastQuestion,
    };
};

// ===== TTS 관리 훅 =====
const useTTSManager = () => {
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

export default function AiInterviewSessionsPage() {
    // 커스텀 훅 사용
    const questionManager = useQuestionManager();
    const ttsManager = useTTSManager();

    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
    const [detectionHistory, setDetectionHistory] = useState<any[]>([]);
    const [transcribedText, setTranscribedText] = useState('');
    const [qaList, setQaList] = useState<Array<{ question: string; answer: string }>>([]);
    const [isCompleting, setIsCompleting] = useState(false);

    const MAX_QUESTIONS = 1;

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);
    const completingRef = useRef(false);
    const webcamRef = useRef<WebcamHandle>(null);
    const recorderRef = useRef<WavRecorder | null>(null);
    const lastAudioBlobRef = useRef<Blob | null>(null);

    const sessionIdRef = useRef<string>(
        `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
    );
    const SESSION_ID = sessionIdRef.current as string;

    const interviewAnalysisMutation = useInterviewAnalysis();

    // ===== API 클라이언트 유틸 =====
    async function fetchFirstQuestion(): Promise<QuestionDto> {
        type SelectedResume = {
            id: number;
            title?: string;
            position?: string;
            company?: string;
            createdAt?: string;
            experience?: string;
            skills?: string[];
        };

        const selectedResumeId = sessionStorage.getItem('selectedResumeId') || undefined;

        let resumeSummary: string | null = null;
        try {
            const raw = sessionStorage.getItem('selectedResume');
            if (raw) {
                const r = JSON.parse(raw) as SelectedResume;
                const parts = [
                    r.title,
                    r.position ? `포지션: ${r.position}` : undefined,
                    r.company ? `회사: ${r.company}` : undefined,
                    r.experience ? `경력: ${r.experience}` : undefined,
                    Array.isArray(r.skills) && r.skills.length
                        ? `기술: ${r.skills.join(', ')}`
                        : undefined,
                ].filter(Boolean) as string[];
                if (parts.length) {
                    resumeSummary = parts.join(' | ');
                }
            }
        } catch (e) {
            console.warn('selectedResume 파싱 실패:', e);
        }

        if (!resumeSummary) {
            resumeSummary =
                localStorage.getItem('resumeSummary') ||
                '프론트엔드 경력 3년, Next.js/React, 크래프톤 정글 (부트캠프) 수료, Pintos 운영체제 프로젝트 수행 경험';
        }

        const jobPostUrl = sessionStorage.getItem('jobPostUrl') || undefined;
        const payload: any = {};
        if (selectedResumeId) payload.resumeFileId = selectedResumeId;
        else payload.resumeSummary = resumeSummary;
        if (jobPostUrl) payload.jobPostUrl = jobPostUrl;

        const res = await api.post(`ai/question`, payload, { timeout: 60000 });
        const data = res.data as { question: QuestionDto };
        return data.question;
    }

    async function fetchFollowup(original: QuestionDto, answer: string): Promise<QuestionDto> {
        const res = await api.post(
            `ai/followups`,
            { originalQuestion: original, answer },
            { timeout: 60000 },
        );
        const data = res.data as {
            followups: Array<{ id: string; parentId: string; text: string; reason: string }>;
        };
        return { id: data.followups[0].id, text: data.followups[0].text };
    }

    async function transcribeWithGoogleSTT(wavBlob: Blob): Promise<string> {
        const wav16k = await resampleTo16kHzMonoWav(wavBlob);

        const form = new FormData();
        form.append('file', wav16k, 'answer.wav');

        const res = await api.post(`stt/transcribe-file`, form, {
            timeout: 120000,
        });

        const data = res.data as { success: boolean; result: { transcript: string } };
        if (!data?.success) throw new Error('STT 실패');
        return data.result.transcript || '';
    }

    // 질문 초기화
    useEffect(() => {
        const initializeFirstQuestion = async () => {
            try {
                localStorage.setItem('aiInterviewSessionId', SESSION_ID);

                questionManager.setIsLoading(true);
                const firstQuestion = await fetchFirstQuestion();
                questionManager.addQuestion(firstQuestion);

                // 첫 질문 TTS 실행
                setTimeout(() => {
                    if (firstQuestion.text) {
                        ttsManager.speakQuestion(firstQuestion.text, firstQuestion.id);
                    }
                }, 100);
            } catch (error) {
                console.warn('첫 질문 생성 실패:', error);

                const fallbackQuestion: QuestionDto = {
                    id: 'q1_fallback',
                    text: interviewData.questions[0],
                };

                questionManager.addQuestion(fallbackQuestion);

                setTimeout(() => {
                    ttsManager.speakQuestion(fallbackQuestion.text, fallbackQuestion.id);
                }, 100);
            } finally {
                questionManager.setIsLoading(false);
                ttsManager.simulateAISpeaking(3000);
            }
        };

        initializeFirstQuestion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 자동 TTS (두 번째 질문부터)
    useEffect(() => {
        const autoSpeak = process.env.NEXT_PUBLIC_AUTO_SPEAK_ON_QUESTION_READY !== 'false';
        if (!autoSpeak) return;
        if (!questionManager.hasCurrentQuestion) return;
        if (questionManager.questions.length === 0) return;
        if (questionManager.currentIndex === 0) return; // 첫 질문은 수동
        if (!questionManager.questionText) return;

        const speakQuestionAsync = async () => {
            try {
                await ttsManager.speakQuestion(
                    questionManager.questionText,
                    questionManager.questionId,
                );
            } catch (e) {
                console.warn('자동 질문 읽기 실패:', e);
            }
        };

        speakQuestionAsync();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionManager.currentIndex, questionManager.hasCurrentQuestion]);

    // 타이머 관리
    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleTimeUp = () => {
        if (completingRef.current) return;
        stopTimer();
        setIsRecording(false);
        message.warning('시간이 초과되었습니다.');
        handleCompleteAnswer();
    };

    // 답변 시작
    const handleStartAnswer = async () => {
        setIsRecording(true);
        setTimeLeft(60);
        setTranscribedText('');
        startTimer();

        const newSession: InterviewSession = {
            questionNumber: questionManager.currentIndex + 1,
            question: questionManager.questionText,
            answer: '',
            timeSpent: 0,
            detectionData: [],
            timestamp: new Date(),
        };
        setCurrentSession(newSession);

        webcamRef.current?.startQuestion(questionManager.questionId, {
            orderNo: questionManager.currentIndex + 1,
            text: questionManager.questionText,
        });

        try {
            recorderRef.current = new WavRecorder();
            await recorderRef.current.start();
        } catch (e) {
            console.error('마이크 접근 실패:', e);
            message.error('마이크 접근 권한을 확인해주세요.');
        }

        ttsManager.simulateAISpeaking(2000);
    };

    // 답변 완료
    const handleCompleteAnswer = async () => {
        if (completingRef.current) return;
        completingRef.current = true;

        let completedSession: InterviewSession | null = null;

        try {
            stopTimer();
            setIsRecording(false);

            // 웹캠 집계
            const agg = webcamRef.current?.endQuestion();
            if (agg) {
                try {
                    await api.post(
                        `metrics/${SESSION_ID}/${questionManager.aggregateId}/aggregate`,
                        agg,
                        {
                            timeout: 10000,
                        },
                    );
                } catch (e) {
                    console.warn('문항 영상 집계 업로드 실패:', e);
                }
            }

            // WAV 처리
            let audioUrl: string | undefined;
            let sttTranscript: string | undefined;

            try {
                const rec = recorderRef.current;
                recorderRef.current = null;

                if (rec) {
                    const blob = await rec.stop();
                    lastAudioBlobRef.current = blob;

                    try {
                        const b64 = await blobToBase64(blob);
                        audioUrl = `data:audio/wav;base64,${b64}`;
                    } catch {
                        audioUrl = URL.createObjectURL(blob);
                    }

                    // 백엔드 음성 분석
                    message.loading('음성을 분석 중입니다...', 0);
                    try {
                        const form = new FormData();
                        form.append('file', blob, `q${questionManager.currentIndex + 1}.wav`);

                        const analysisRes = await api.post(
                            `/audio-metrics/${SESSION_ID}/${questionManager.aggregateId}/analyze`,
                            form,
                            { timeout: 120000 },
                        );

                        if (analysisRes.data?.ok) {
                            console.log('백엔드를 통한 음성 분석 완료:', analysisRes.data.features);
                        }
                    } catch (e) {
                        console.warn('백엔드를 통한 음성 분석 실패:', e);
                    } finally {
                        message.destroy();
                    }

                    // Google STT
                    message.loading('구글 STT로 답변을 전사 중...', 0);
                    try {
                        sttTranscript = await transcribeWithGoogleSTT(blob);
                    } finally {
                        message.destroy();
                    }
                }
            } catch (e) {
                message.destroy();
                console.error('녹음/전사 처리 실패:', e);
                message.warning('전사(STT)에 실패했어요. 네트워크를 확인해주세요.');
            }

            if (currentSession) {
                const finalAnswer =
                    (sttTranscript && sttTranscript.trim()) ||
                    (transcribedText && transcribedText.trim()) ||
                    `답변 ${currentSession.questionNumber}번 완료`;

                completedSession = {
                    ...currentSession,
                    question: questionManager.questionText,
                    answer: finalAnswer,
                    timeSpent: 60 - timeLeft,
                    audioUrl,
                };

                setSessions((prev) => [...prev, completedSession!]);
                setQaList((prev) => [
                    ...prev,
                    { question: questionManager.questionText, answer: finalAnswer },
                ]);
                setCurrentSession(null);

                // 다음 질문 처리
                if (!questionManager.isLastQuestion(MAX_QUESTIONS)) {
                    try {
                        const originalQuestion: QuestionDto = {
                            id: questionManager.questionId,
                            text: questionManager.questionText,
                        };

                        message.loading('다음 질문을 생성 중...', 0);
                        const nextQuestion = await fetchFollowup(originalQuestion, finalAnswer);
                        questionManager.addQuestion(nextQuestion);

                        setTimeout(() => {
                            questionManager.moveToNext();
                            setTimeLeft(60);
                            ttsManager.speakQuestion(nextQuestion.text, nextQuestion.id);
                        }, 1000);
                    } catch (error) {
                        console.warn('꼬리질문 생성 실패:', error);

                        const fallback: QuestionDto = {
                            id: `fallback_${Date.now()}`,
                            text:
                                interviewData.questions[
                                    Math.min(
                                        questionManager.currentIndex + 1,
                                        interviewData.questions.length - 1,
                                    )
                                ] ||
                                '이전 답변에서 수치/성과를 확인할 수 있는 사례를 하나 제시해 주세요.',
                        };
                        questionManager.addQuestion(fallback);

                        setTimeout(() => {
                            questionManager.moveToNext();
                            setTimeLeft(60);
                            ttsManager.speakQuestion(fallback.text, fallback.id);
                        }, 1000);
                    } finally {
                        message.destroy();
                    }
                } else {
                    message.success('모든 답변이 완료되었습니다!');
                    setTimeout(() => {
                        handleInterviewCompletion([...sessions, completedSession!]);
                    }, 1000);
                }
            }

            setTranscribedText('');
        } finally {
            completingRef.current = false;
        }
    };

    // 면접 완료 처리
    const handleInterviewCompletion = async (finalSessions?: InterviewSession[]) => {
        const sessionsToUse = finalSessions || sessions;
        const latestQAList = sessionsToUse.map((session) => ({
            question: session.question,
            answer: session.answer,
        }));

        // 서버 API 호출로 음성 지표 가져오기
        let serverAudioData = null;
        try {
            const audioRes = await api.get(`/audio-metrics/${SESSION_ID}/overall`);
            if (audioRes.data?.ok && audioRes.data?.overall) {
                serverAudioData = audioRes.data.overall;
                console.log('서버에서 음성 지표 로드 성공:', serverAudioData);
            }
        } catch (e) {
            console.warn('서버 음성 지표 로드 실패:', e);
        }

        if (serverAudioData) {
            try {
                localStorage.setItem(
                    'interviewAudioOverallServer',
                    JSON.stringify(serverAudioData),
                );
            } catch (e) {
                console.warn('서버 음성 지표 localStorage 저장 실패:', e);
            }
        }

        // 문항별 음성 지표도 서버에서 가져오기
        let serverAudioPerQuestion = null;
        try {
            const audioPerQRes = await api.get(`/audio-metrics/${SESSION_ID}`);
            if (audioPerQRes.data?.ok && audioPerQRes.data?.rows) {
                serverAudioPerQuestion = audioPerQRes.data.rows;
                console.log('서버에서 문항별 음성 지표 로드 성공:', serverAudioPerQuestion);
            }
        } catch (e) {
            console.warn('서버 문항별 음성 지표 로드 실패:', e);
        }

        if (serverAudioPerQuestion) {
            try {
                localStorage.setItem(
                    'interviewAudioPerQuestionServer',
                    JSON.stringify(serverAudioPerQuestion),
                );
            } catch (e) {
                console.warn('서버 문항별 음성 지표 localStorage 저장 실패:', e);
            }
        }

        // 결과를 로컬에 보관
        const audioPerQuestionFull = sessionsToUse.map((s) => ({
            questionNumber: s.questionNumber,
            question: s.question,
            audioFeatures: s.audioFeatures,
            audioUrl: s.audioUrl,
        }));

        try {
            localStorage.setItem('interviewAudioPerQuestion', JSON.stringify(audioPerQuestionFull));
        } catch (e) {
            try {
                const reduced = audioPerQuestionFull.map(({ audioUrl, ...rest }) => rest);
                localStorage.setItem('interviewAudioPerQuestion', JSON.stringify(reduced));
                console.warn(
                    'localStorage quota exceeded: stored audioPerQuestion without audioUrl',
                );
            } catch (e2) {
                console.warn('Failed to store interviewAudioPerQuestion:', e2);
            }
        }

        try {
            const finalizeRes = await api.post(
                `/metrics/${SESSION_ID}/finalize`,
                {},
                { timeout: 10000 },
            );
            const visualAgg = finalizeRes.data?.aggregate;
            if (visualAgg) {
                localStorage.setItem(
                    'interviewVisualPerQuestion',
                    JSON.stringify(visualAgg.perQuestion),
                );
                localStorage.setItem('interviewVisualOverall', JSON.stringify(visualAgg.overall));
            }
        } catch (e: any) {
            console.warn('세션 영상 집계 finalize 실패:', {
                url: `${API_BASE_URL}/metrics/${SESSION_ID}/finalize`,
                status: e?.response?.status,
                data: e?.response?.data,
            });
        }

        // 질문-답변 리스트를 콘솔에 출력
        console.log('🎯 면접 완료 - 질문답변 리스트:');
        console.log('=====================================');
        latestQAList.forEach((qa, index) => {
            console.log(`\n📝 Q${index + 1}. ${qa.question}`);
            console.log(`💬 A${index + 1}. ${qa.answer}`);
            console.log('-------------------------------------');
        });
        console.log(`\n✅ 총 ${latestQAList.length}개의 질문에 답변했습니다.`);
        console.log('=====================================');

        // 백엔드 리포트 분석 호출
        message.loading('면접 결과를 분석 중입니다...', 0);
        try {
            const res = await api.post(
                `/report/${SESSION_ID}/analyze`,
                { qa: latestQAList },
                { timeout: 60000 },
            );
            if (res.data?.success) {
                localStorage.setItem('interviewAnalysis', JSON.stringify(res.data.data));
            }
        } catch (error) {
            console.error('리포트 분석 호출 실패:', error);
        } finally {
            message.destroy();
            try {
                localStorage.setItem('interviewQA', JSON.stringify(latestQAList));
            } catch {}
            setTimeout(() => {
                window.location.href = '/ai-interview/result';
            }, 800);
        }
    };

    // 웹캠 감지 데이터 처리
    const handleDetection = (data: any) => {
        setDetectionHistory((prev) => [...prev, data]);

        if (currentSession) {
            setCurrentSession((prev) =>
                prev
                    ? {
                          ...prev,
                          detectionData: [...prev.detectionData, data],
                      }
                    : null,
            );
        }
    };

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            ttsManager.cleanup();
        };
    }, []);

    return (
        <div className='w-screen h-screen flex flex-col justify-end items-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 relative overflow-hidden'>
            <Webcam ref={webcamRef} css='absolute top-0 right-0' onDetection={handleDetection} />

            <div>
                <Avatar
                    name={interviewData.interviewer.name}
                    title={interviewData.interviewer.title}
                    isSpeaking={ttsManager.isSpeaking}
                    videoUrl={ttsManager.avatarVideoUrl}
                    onEnded={ttsManager.onAvatarEnded}
                />
            </div>

            {/* 질문이 로딩되었을 때만 표시 */}
            {questionManager.hasCurrentQuestion && (
                <Question
                    question={questionManager.questionText}
                    questionNumber={questionManager.currentIndex + 1}
                    totalQuestions={MAX_QUESTIONS}
                    isRecording={isRecording}
                    timeLeft={timeLeft}
                    onStartAnswer={handleStartAnswer}
                    onCompleteAnswer={handleCompleteAnswer}
                />
            )}

            {/* 로딩 상태 표시 */}
            {questionManager.isLoading && (
                <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
                    <div className='text-lg'>질문을 준비 중입니다...</div>
                </div>
            )}

            {/* 진행 상태 */}
            <div className='absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-4'>
                <div className='text-sm text-gray-600'>
                    <div>
                        진행률:{' '}
                        {Math.round(((questionManager.currentIndex + 1) / MAX_QUESTIONS) * 100)}%
                    </div>
                    <div>완료된 질문: {sessions.length}</div>
                    <div>감지된 피드백: {detectionHistory.length}</div>
                </div>
            </div>
        </div>
    );
}
