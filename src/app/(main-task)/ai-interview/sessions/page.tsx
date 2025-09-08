'use client';

import { useState, useEffect, useRef } from 'react';
import { Webcam, WebcamHandle, Question, Avatar } from '../_components';
import { message } from 'antd';
import { useInterviewAnalysis } from '@/hooks/use-interview-analysis';
import { blobToBase64, resampleTo16kHzMonoWav } from '@/utils/audio';
import axios from 'axios';
import { api } from '@/apis/api'; // 경로는 실제 위치에 맞게 조정
import { AUDIO_API_BASE, API_BASE_URL } from '@/constants/config';

// ===== 추가: WAV 레코더 유틸 =====
class WavRecorder {
    private audioCtx: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private buffers: Float32Array[] = [];
    private recording = false;
    private stopped = false; // ⬅️ 추가: 중복 stop 방지 플래그

    async start() {
        // 이미 켜져있다면 무시 (혹은 먼저 stop() 호출)
        if (this.recording) return;
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.source = this.audioCtx.createMediaStreamSource(this.stream);
        this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
        this.source.connect(this.processor);
        // ScriptProcessor는 destination에 연결해야 onaudioprocess가 트리거됨
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
        // ⬇️ 중복 호출 방지
        if (this.stopped) {
            // 이미 만들어둔 마지막 WAV가 없다면 최소한의 빈 WAV라도 반환
            return this.encodeWAV(new Float32Array(0), this.audioCtx?.sampleRate || 44100);
        }
        this.stopped = true;
        this.recording = false;

        // 안전하게 끊기
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

        // AudioContext 닫기 (닫힌 상태면 skip)
        try {
            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                await this.audioCtx.close();
            }
        } catch {
            // InvalidStateError 등은 무시
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
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // mono
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

// Web Speech API 타입 정의
declare global {
    interface Window {
        webkitSpeechRecognition: any;
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
    // Diagnostics
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
    // ===== 추가: 오디오 관련 필드 =====
    audioUrl?: string; // 클라이언트에서 재생용
    audioFeatures?: AudioFeatures; // 서버 분석 결과
}

export default function AiInterviewSessionsPage() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
    const [detectionHistory, setDetectionHistory] = useState<any[]>([]);
    const [transcribedText, setTranscribedText] = useState('');
    const [qaList, setQaList] = useState<Array<{ question: string; answer: string }>>([]);
    // 동적 질문 목록 (AI 생성)
    const [dynamicQuestions, setDynamicQuestions] = useState<QuestionDto[]>([]);
    // 전체 문항 수(기존 더미와 동일하게 3로 유지; 필요 시 조정)
    const MAX_QUESTIONS = 1;

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);
    const completingRef = useRef(false); // 완료 처리 재진입 가드
    const webcamRef = useRef<WebcamHandle>(null);
    const isSpeakingRef = useRef(false);

    // ===== 추가: WAV 레코더 인스턴스 & 최신 오디오 Blob 참조 =====
    const recorderRef = useRef<WavRecorder | null>(null);
    const lastAudioBlobRef = useRef<Blob | null>(null);

    // 컴포넌트 내부: 세션ID를 한 번 생성해 유지 (uuid 없어도 OK)
    const sessionIdRef = useRef<string>(
        `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
    );
    const SESSION_ID = sessionIdRef.current as any as string;
    // // 질문ID는 q1/q2/... 형태로 쓸게요.
    // const qid = `q${currentQuestionIndex + 1}`;
    // const qtext = interviewData.questions[currentQuestionIndex];
    // 현재 질문(동적). 아직 로딩 전이면 undefined
    const currentQuestion = dynamicQuestions[currentQuestionIndex];
    const qtext = currentQuestion?.text ?? interviewData.questions[currentQuestionIndex] ?? '';
    // 집계/메트릭 전송에는 q1/q2/... (기존 규칙 유지)
    const aggQid = `q${currentQuestionIndex + 1}`;
    // 웹캠 startQuestion에는 실제 질문 ID를 전달(없으면 aggQid)
    const currentQuestionId = currentQuestion?.id ?? aggQid;

    // react-query hook
    const interviewAnalysisMutation = useInterviewAnalysis();

    // const AI_API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/ai`;

    // ===== API 클라이언트 유틸 =====
    async function fetchFirstQuestion(): Promise<QuestionDto> {
        //if (!AI_API_BASE) throw new Error('NEXT_PUBLIC_API_BASE_URL 미설정');
        // select/page.tsx에서 저장한 선택 이력서/채용공고 URL 활용
        type SelectedResume = {
            id: number;
            title?: string;
            position?: string;
            company?: string;
            createdAt?: string;
            experience?: string;
            skills?: string[];
        };

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

        // 폴백: 예전 로컬 저장 요약 또는 기본값
        if (!resumeSummary) {
            resumeSummary =
                localStorage.getItem('resumeSummary') ||
                '프론트엔드 경력 3년, Next.js/React, 크래프톤 정글 (부트캠프) 수료, Pintos 운영체제 프로젝트 수행 경험';
        }

        const jobPostUrl = sessionStorage.getItem('jobPostUrl') || undefined;
        const payload: any = { resumeSummary };
        if (jobPostUrl) payload.jobPostUrl = jobPostUrl;

        const res = await api.post(`ai/question`, payload, { timeout: 60000 });
        const data = res.data as { question: QuestionDto };
        return data.question;
    }

    async function fetchFollowup(original: QuestionDto, answer: string): Promise<QuestionDto> {
        //if (!AI_API_BASE) throw new Error('NEXT_PUBLIC_API_BASE_URL 미설정');
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

    const [isCompleting, setIsCompleting] = useState(false); // (선택) UI에서 버튼 비활성화 등에 사용

    // 기존: Web Speech API 사용 여부 플래그 (원하면 true 유지)
    const USE_LOCAL_INTERIM_CAPTIONS = true;

    //const STT_API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/stt`;

    async function transcribeWithGoogleSTT(wavBlob: Blob): Promise<string> {
        //if (!STT_API_BASE) throw new Error('NEXT_PUBLIC_STT_API_BASE_URL 미설정');
        // (권장) 16kHz 리샘플 후 전송 — 이미 구현해둔 함수 재사용
        const wav16k = await resampleTo16kHzMonoWav(wavBlob);

        const form = new FormData();
        form.append('file', wav16k, 'answer.wav'); // 필드명은 서버의 FileInterceptor('file')와 동일해야 함

        const res = await api.post(`/stt/transcribe-file`, form, {
            timeout: 120000,
            // ❗️Content-Type 수동 지정 금지(axios가 boundary 자동 설정)
            // headers: { 'Content-Type': 'multipart/form-data' }
        });

        const data = res.data as { success: boolean; result: { transcript: string } };
        if (!data?.success) throw new Error('STT 실패');
        return data.result.transcript || '';
    }

    const synthesizeSpeech = async (text: string): Promise<string> => {
        //const TTS_API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/tts`;
        //if (!TTS_API_BASE) throw new Error('NEXT_PUBLIC_API_BASE_URL 미설정');

        try {
            const response = await api.post(
                `tts/synthesize`,
                {
                    text: text,
                    languageCode: 'ko-KR',
                    voiceName: 'ko-KR-Standard-A',
                    audioEncoding: 'MP3',
                },
                {
                    timeout: 30000,
                    responseType: 'blob',
                },
            );

            const audioUrl = URL.createObjectURL(response.data);
            return audioUrl;
        } catch (error) {
            console.error('TTS 요청 실패:', error);
            throw error;
        }
    };

    // 실제 TTS로 질문 읽기
    const speakQuestion = async (questionText: string) => {
        // 이미 TTS가 진행 중이면 무시
        if (isSpeakingRef.current) {
            console.log('TTS가 이미 진행 중입니다. 중복 요청 무시.');
            return;
        }

        isSpeakingRef.current = true;
        setIsSpeaking(true);

        try {
            const audioUrl = await synthesizeSpeech(questionText);

            const audio = new Audio(audioUrl);

            audio.onended = () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false; // 완료 시 플래그 해제
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                console.error('오디오 재생 실패');
                setIsSpeaking(false);
                isSpeakingRef.current = false; // 에러 시 플래그 해제
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (error) {
            console.error('TTS 처리 실패:', error);
            setIsSpeaking(false);
            isSpeakingRef.current = false; // 에러 시 플래그 해제

            // TTS 실패 시 기존 시뮬레이션으로 폴백
            simulateAISpeaking(3000);
        }
    };

    // AI가 말하는 시뮬레이션
    const simulateAISpeaking = (duration: number = 3000) => {
        setIsSpeaking(true);
        if (speakingTimerRef.current) {
            clearTimeout(speakingTimerRef.current);
        }
        speakingTimerRef.current = setTimeout(() => {
            setIsSpeaking(false);
        }, duration);
    };

    // 타이머 시작
    const startTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // 시간 초과
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // 타이머 정지
    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // 시간 초과 처리
    const handleTimeUp = () => {
        if (completingRef.current) return; // ⬅️ 이미 완료 중이면 무시
        stopTimer();
        setIsRecording(false);
        message.warning('시간이 초과되었습니다.');
        handleCompleteAnswer();
    };

    // Web Speech API 초기화
    const initializeSpeechRecognition = () => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ko-KR';

            recognition.onstart = () => {
                console.log('🎤 음성 인식 시작');
            };

            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setTranscribedText(finalTranscript + interimTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error('음성 인식 오류:', event.error);
            };

            recognition.onend = () => {
                console.log('🎤 음성 인식 종료');
            };

            recognitionRef.current = recognition;
            return recognition;
        } else {
            console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
            return null;
        }
    };

    // 음성 인식 시작
    const startSpeechRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.start();
        }
    };

    // 음성 인식 중지
    const stopSpeechRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    // 기존: fetch 버전 analyzeAudioBlob
    // -> axios 버전으로 교체
    const analyzeAudioBlob = async (
        blob: Blob,
        filename = 'answer.wav',
    ): Promise<AudioFeatures> => {
        if (!AUDIO_API_BASE) throw new Error('AUDIO_API_BASE가 설정되지 않았습니다.');
        const form = new FormData();
        form.append('file', blob, filename);

        // axios는 브라우저에서 multipart boundary를 자동 설정합니다. Content-Type 수동 지정 X
        const res = await axios.post(`${AUDIO_API_BASE}/audio/analyze`, form, {
            timeout: 60000, // 선택: 타임아웃
            withCredentials: false, // CORS 쿠키 미사용이면 false (기본값)
            // headers: { 'Content-Type': 'multipart/form-data' } // 직접 지정하지 않는 것을 권장
        });
        return res.data?.features as AudioFeatures;
    };

    // ChatGPT API 호출 형식으로 데이터 변환
    const formatMessagesForChatGPT = (qaList: Array<{ question: string; answer: string }>) => {
        const interviewContext = `
면접관: ${interviewData.interviewer.name} (${interviewData.interviewer.title})

면접 질문과 답변:
${qaList
    .map(
        (qa, index) => `
질문 ${index + 1}: ${qa.question}
답변 ${index + 1}: ${qa.answer}
`,
    )
    .join('\n')}

위의 면접 내용을 바탕으로 다음과 같은 JSON 형식으로 분석해주세요:

{
  "overall_score": 85,
  "detailed_scores": {
    "completeness": 8,
    "specificity": 7,
    "logic": 9,
    "impression": 8
  },
  "strengths": [
    "기술적 지식이 탄탄함",
    "논리적인 사고 과정",
    "구체적인 경험 제시"
  ],
  "improvements": [
    "더 구체적인 수치와 결과 제시 필요",
    "실무 경험의 깊이 보완 필요"
  ],
  "detailed_feedback": {
    "question_1": {
      "score": 8,
      "feedback": "기술 스택에 대한 기본적인 이해도는 있으나, 구체적인 경험 사례가 부족합니다."
    },
    "question_2": {
      "score": 7,
      "feedback": "아키텍처 설계 경험은 있으나, 대용량 트래픽 처리에 대한 구체적인 수치가 필요합니다."
    },
    "question_3": {
      "score": 9,
      "feedback": "데이터베이스 최적화에 대한 깊이 있는 이해를 보여주었습니다."
    }
  },
  "overall_evaluation": "전반적으로 백엔드 개발에 대한 기본기는 탄탄하나, 실무 경험을 바탕으로 한 구체적인 사례 제시가 필요한 상태입니다. 지속적인 학습과 프로젝트 경험을 통해 기술적 깊이를 쌓아가시길 권합니다.",
  "recommendations": [
    "실제 프로젝트에서의 성능 개선 사례를 정리해보세요",
    "대용량 트래픽 처리 경험을 쌓기 위한 사이드 프로젝트를 추천합니다",
    "기술 블로그 작성을 통해 학습한 내용을 정리해보세요"
  ]
}

반드시 위의 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요.
        `.trim();

        return {
            messages: [
                {
                    role: 'system' as const,
                    content:
                        '당신은 경험이 풍부한 면접관입니다. 면접자의 답변을 객관적이고 건설적으로 분석하여 JSON 형식으로 응답해주세요.',
                },
                {
                    role: 'user' as const,
                    content: interviewContext,
                },
            ],
        };
    };

    // 면접 완료 처리 (API 호출 포함)
    const handleInterviewCompletion = async (finalSessions?: InterviewSession[]) => {
        // 최신 qaList를 가져오기 위해 sessions에서 재구성
        const sessionsToUse = finalSessions || sessions;
        const latestQAList = sessionsToUse.map((session) => ({
            question: session.question,
            answer: session.answer,
        }));

        // (선택) 오디오 종합 평균 같은 간단 요약 만들기
        const audioAgg = (() => {
            const feats = sessionsToUse
                .map((s) => s.audioFeatures)
                .filter(Boolean) as AudioFeatures[];
            const mean = (arr: number[]) =>
                arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
            const meanOf = (pick: (f: AudioFeatures) => number | undefined) =>
                mean(
                    feats
                        .map(pick)
                        .filter((v): v is number => typeof v === 'number' && isFinite(v)),
                );
            const safeCv = (f: AudioFeatures) =>
                typeof f.f0_cv === 'number' && isFinite(f.f0_cv) && f.f0_cv >= 0
                    ? f.f0_cv
                    : f.f0_mean > 0
                      ? (f.f0_std ?? 0) / f.f0_mean
                      : 0;
            const approxSemitoneStd = (cv: number) => {
                // 근사: 세미톤 표준편차 ≈ 12 * log2(1 + CV)
                return 12 * Math.log2(1 + Math.max(0, cv));
            };
            return {
                f0_mean: mean(feats.map((f) => f.f0_mean)),
                f0_std: mean(feats.map((f) => f.f0_std)),
                // 종합에도 CV/세미톤 표준편차를 포함해 톤 점수 안정화
                f0_cv: mean(feats.map((f) => safeCv(f))),
                f0_std_semitone: mean(feats.map((f) => approxSemitoneStd(safeCv(f)))),
                rms_cv: mean(feats.map((f) => f.rms_cv)),
                rms_cv_voiced: mean(
                    feats.map((f) =>
                        typeof f.rms_cv_voiced === 'number' ? f.rms_cv_voiced : f.rms_cv || 0,
                    ),
                ),
                rms_db_std_voiced: mean(
                    feats.map((f) =>
                        typeof f.rms_db_std_voiced === 'number' ? f.rms_db_std_voiced : 0,
                    ),
                ),
                jitter_like: mean(feats.map((f) => f.jitter_like)),
                shimmer_like: mean(feats.map((f) => f.shimmer_like)),
                silence_ratio: mean(feats.map((f) => f.silence_ratio)),
                silence_ratio_db50: meanOf((f) => f.silence_ratio_db50),
                voiced_ratio: mean(
                    feats.map((f) => (typeof f.voiced_ratio === 'number' ? f.voiced_ratio : 0)),
                ),
                voiced_ratio_speech: meanOf((f) => f.voiced_ratio_speech),
                // Diagnostics 평균
                voiced_prob_mean: meanOf((f) => f.voiced_prob_mean),
                voiced_prob_median: meanOf((f) => f.voiced_prob_median),
                voiced_prob_p90: meanOf((f) => f.voiced_prob_p90),
                voiced_flag_ratio: meanOf((f) => f.voiced_flag_ratio),
                voiced_prob_ge_025_ratio: meanOf((f) => f.voiced_prob_ge_025_ratio),
                voiced_prob_ge_035_ratio: meanOf((f) => f.voiced_prob_ge_035_ratio),
                f0_valid_ratio: meanOf((f) => f.f0_valid_ratio),
                speech_frames: meanOf((f) =>
                    typeof f.speech_frames === 'number' && isFinite(f.speech_frames)
                        ? f.speech_frames
                        : undefined,
                ),
            };
        })();

        // 결과를 로컬에 보관(결과 페이지에서 활용)
        localStorage.setItem(
            'interviewAudioPerQuestion',
            JSON.stringify(
                sessionsToUse.map((s) => ({
                    questionNumber: s.questionNumber,
                    question: s.question,
                    audioFeatures: s.audioFeatures,
                    audioUrl: s.audioUrl,
                })),
            ),
        );
        localStorage.setItem('interviewAudioOverall', JSON.stringify(audioAgg));

        try {
            const finalizeRes = await api.post(
                `/metrics/${SESSION_ID}/finalize`,
                {},
                { timeout: 10000 },
            );
            // 응답 형식: { ok: true, aggregate: { perQuestion: {...}, overall: {...} } }
            const visualAgg = finalizeRes.data?.aggregate;
            if (visualAgg) {
                // 결과 페이지에서 사용하도록 보관
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

        // 백엔드 API 호출하여 면접 분석
        message.loading('면접 결과를 분석 중입니다...', 0);

        try {
            // 최신 qaList로 데이터 형식 변환
            const requestData = formatMessagesForChatGPT(latestQAList);

            // 백엔드 개발자용 요청 데이터 로그 출력
            console.log('🚀 백엔드 API 요청 데이터:');
            console.log('=====================================');
            console.log('📡 API 엔드포인트:', `${API_BASE_URL}/interview/analyze`);
            console.log('📋 요청 메서드: POST');
            console.log('📦 요청 헤더:', {
                'Content-Type': 'application/json',
            });
            console.log('📄 요청 바디:', JSON.stringify(requestData, null, 2));
            console.log('=====================================');

            // 백엔드 개발자용 cURL 명령어 예시
            console.log('🔧 백엔드 개발자용 cURL 명령어:');
            console.log('=====================================');
            console.log(`curl -X POST "${API_BASE_URL}/interview/analyze" \\`);
            console.log(`  -H "Content-Type: application/json" \\`);
            console.log(`  -d '${JSON.stringify(requestData)}'`);
            console.log('=====================================');

            const analysisResult = await interviewAnalysisMutation.mutateAsync(requestData);
            message.destroy();

            if (analysisResult.success) {
                message.success('면접 분석이 완료되었습니다!');
                console.log('🤖 면접 분석 결과:', analysisResult);

                // 분석 결과를 localStorage에 저장 (결과 페이지에서 사용)
                localStorage.setItem('interviewAnalysis', JSON.stringify(analysisResult.data));
                localStorage.setItem('interviewQA', JSON.stringify(latestQAList));
            } else {
                console.error('❌ API 응답 실패:', analysisResult.error);
                // 실패해도 localStorage에 실패 정보 저장
                localStorage.setItem(
                    'interviewAnalysis',
                    JSON.stringify({
                        error: true,
                        message: analysisResult.error || '면접 분석에 실패했습니다.',
                    }),
                );
                localStorage.setItem('interviewQA', JSON.stringify(latestQAList));
            }

            // 성공/실패 관계없이 결과 페이지로 이동
            setTimeout(() => {
                window.location.href = '/ai-interview/result';
            }, 10000); // 테스트 용도로 일단 20초, 원래 2초였음
        } catch (error) {
            message.destroy();
            console.error('❌ 면접 분석 API 호출 오류:', error);

            // API 호출 실패 시에도 localStorage에 실패 정보 저장
            localStorage.setItem(
                'interviewAnalysis',
                JSON.stringify({
                    error: true,
                    message: 'API 호출 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.',
                }),
            );
            localStorage.setItem('interviewQA', JSON.stringify(latestQAList));

            // 실패해도 결과 페이지로 이동
            setTimeout(() => {
                window.location.href = '/ai-interview/result';
            }, 10000); // 테스트 용도로 일단 20초, 원래 2초였음
        }
    };

    // 답변 시작 - 원래 async 없었는데 밑에서 await 쓰면서 GPT가 추가
    const handleStartAnswer = async () => {
        setIsRecording(true);
        setTimeLeft(60);
        setTranscribedText('');
        startTimer();

        // 새로운 세션 시작
        const newSession: InterviewSession = {
            questionNumber: currentQuestionIndex + 1,
            question: qtext,
            answer: '',
            timeSpent: 0,
            detectionData: [],
            timestamp: new Date(),
        };
        setCurrentSession(newSession);

        // ▼ 문항 시작: 웹캠에 문항 메타 전달 (id는 실제 질문 ID 사용, 없으면 aggQid)
        webcamRef.current?.startQuestion(currentQuestionId, {
            orderNo: currentQuestionIndex + 1,
            text: qtext,
        });

        if (USE_LOCAL_INTERIM_CAPTIONS) {
            startSpeechRecognition(); // 유지 시
        }

        // WAV 레코더 시작
        try {
            recorderRef.current = new WavRecorder();
            await recorderRef.current.start();
        } catch (e) {
            console.error('마이크 접근 실패:', e);
            message.error('마이크 접근 권한을 확인해주세요.');
        }

        // AI가 말하는 시뮬레이션
        simulateAISpeaking(2000);
    };

    // 답변 완료
    const handleCompleteAnswer = async () => {
        // 재진입/중복 호출 가드 (타이머 만료와 버튼 클릭이 겹칠 수 있음)
        if (completingRef.current) return;
        completingRef.current = true;

        let completedSession: InterviewSession | null = null;

        try {
            stopTimer();
            setIsRecording(false);

            // 음성 인식 중지는 실패해도 무시
            try {
                if (USE_LOCAL_INTERIM_CAPTIONS) stopSpeechRecognition();
            } catch {}

            // ▼ 문항 종료: 집계 결과 받기 & 서버로 전송
            const agg = webcamRef.current?.endQuestion();
            if (agg) {
                try {
                    await api.post(`/metrics/${SESSION_ID}/${aggQid}/aggregate`, agg, {
                        timeout: 10000,
                    });
                } catch (e) {
                    console.warn('문항 영상 집계 업로드 실패:', e);
                }
            }

            // WAV 정지 → 업로드/전사
            let audioUrl: string | undefined;
            let audioFeatures: AudioFeatures | undefined;
            let sttTranscript: string | undefined;

            try {
                // recorder 인스턴스를 지역 변수로 복사하고, 즉시 ref에서 떼어 재사용을 차단
                const rec = recorderRef.current;
                recorderRef.current = null;

                if (rec) {
                    const blob = await rec.stop(); // WavRecorder.stop()이 한 번만 호출되도록 보장
                    lastAudioBlobRef.current = blob;
                    audioUrl = URL.createObjectURL(blob);

                    // (선택) 오디오 분석
                    try {
                        audioFeatures = await analyzeAudioBlob(
                            blob,
                            `q${currentQuestionIndex + 1}.wav`,
                        );
                    } catch (e) {
                        console.warn('오디오 분석 실패:', e);
                    }

                    // ✅ Google STT 호출 (최종 답변 확정)
                    message.loading('구글 STT로 답변을 전사 중...', 0);
                    try {
                        sttTranscript = await transcribeWithGoogleSTT(blob);
                    } finally {
                        message.destroy(); // 메시지는 finally에서 안전하게 정리
                    }
                }
            } catch (e) {
                message.destroy();
                console.error('녹음/전사 처리 실패:', e);
                message.warning('전사(STT)에 실패했어요. 네트워크를 확인해주세요.');
            }

            if (currentSession) {
                // 최종 답변은 STT > 임시 자막 > 기본 문구 순으로 결정
                const finalAnswer =
                    (sttTranscript && sttTranscript.trim()) ||
                    (transcribedText && transcribedText.trim()) ||
                    `답변 ${currentSession.questionNumber}번 완료`;

                completedSession = {
                    ...currentSession,
                    answer: finalAnswer,
                    timeSpent: 60 - timeLeft,
                    audioUrl,
                    audioFeatures,
                };

                setSessions((prev) => [...prev, completedSession!]);
                setQaList((prev) => [
                    ...prev,
                    { question: currentSession.question, answer: finalAnswer },
                ]);
                setCurrentSession(null);

                // ===== 문항 종료 시: STT 답변으로 꼬리질문 생성 =====
                if (currentQuestionIndex < MAX_QUESTIONS - 1) {
                    try {
                        // 현재 질문 객체(동적) 기준
                        const original: QuestionDto = currentQuestion
                            ? { id: currentQuestion.id, text: currentQuestion.text }
                            : { id: aggQid, text: currentSession.question };
                        message.loading('다음 질문을 생성 중...', 0);
                        const nextQ = await fetchFollowup(original, finalAnswer);
                        setDynamicQuestions((prev) => [...prev, nextQ]);

                        // ✅ 질문 생성 직후 바로 다음 단계 실행
                        setTimeout(async () => {
                            setCurrentQuestionIndex((prev) => prev + 1);
                            setTimeLeft(60);
                            // nextQ를 직접 사용 (상태 업데이트를 기다리지 않음)
                            if (nextQ?.text) {
                                await speakQuestion(nextQ.text);
                            } else {
                                simulateAISpeaking(1500);
                            }
                        }, 1000);
                    } catch (e) {
                        console.warn('꼬리질문 생성 실패. 더미로 폴백:', e);
                        const fallback: QuestionDto = {
                            id: `fallback_${Date.now()}`,
                            text:
                                interviewData.questions[
                                    Math.min(
                                        currentQuestionIndex + 1,
                                        interviewData.questions.length - 1,
                                    )
                                ] ||
                                '이전 답변에서 수치/성과를 확인할 수 있는 사례를 하나 제시해 주세요.',
                        };
                        setDynamicQuestions((prev) => [...prev, fallback]);

                        // ✅ 폴백 질문도 직접 사용
                        setTimeout(async () => {
                            setCurrentQuestionIndex((prev) => prev + 1);
                            setTimeLeft(60);
                            if (fallback?.text) {
                                await speakQuestion(fallback.text);
                            } else {
                                simulateAISpeaking(1500);
                            }
                        }, 1000);
                    } finally {
                        try {
                            message.destroy();
                        } catch {}
                    }
                } else {
                    // 마지막 질문인 경우
                    message.success('모든 답변이 완료되었습니다!');
                    setTimeout(() => {
                        handleInterviewCompletion([...sessions, completedSession!]);
                    }, 1000);
                }
            }

            setTranscribedText('');
        } finally {
            // 재진입 가능 상태로 복구
            completingRef.current = false;
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

    // 마운트 시 "첫 질문" 준비 + 음성 인식 초기화
    useEffect(() => {
        (async () => {
            try {
                const q = await fetchFirstQuestion();
                setDynamicQuestions([q]);

                // 첫 질문을 TTS로 읽기
                if (q.text) {
                    await speakQuestion(q.text);
                }
            } catch (e) {
                console.warn('첫 질문 생성 실패. 더미 사용:', e);
                const fallbackQuestion = interviewData.questions[0];
                setDynamicQuestions([{ id: 'q1', text: interviewData.questions[0] }]);
                if (fallbackQuestion) {
                    await speakQuestion(fallbackQuestion);
                }
            } finally {
                simulateAISpeaking(3000);
                initializeSpeechRecognition();
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (speakingTimerRef.current) {
                clearTimeout(speakingTimerRef.current);
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    return (
        <div className='w-screen h-screen flex flex-col justify-end items-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 relative overflow-hidden'>
            {/* 웹캠 */}
            <Webcam ref={webcamRef} css='absolute top-0 right-0' onDetection={handleDetection} />

            {/* AI 아바타 */}
            <div>
                <Avatar
                    name={interviewData.interviewer.name}
                    title={interviewData.interviewer.title}
                    isSpeaking={isSpeaking}
                />
            </div>

            {/* 질문: 동적 질문이 준비된 경우에만 렌더 */}
            {currentQuestion && (
                <Question
                    question={qtext}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={MAX_QUESTIONS}
                    isRecording={isRecording}
                    timeLeft={timeLeft}
                    onStartAnswer={handleStartAnswer}
                    onCompleteAnswer={handleCompleteAnswer}
                />
            )}

            {/* 면접 진행 상태 표시 */}
            <div className='absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-4'>
                <div className='text-sm text-gray-600'>
                    <div>
                        진행률: {Math.round(((currentQuestionIndex + 1) / MAX_QUESTIONS) * 100)}%
                    </div>
                    <div>완료된 질문: {sessions.length}</div>
                    <div>감지된 피드백: {detectionHistory.length}</div>
                </div>
            </div>
        </div>
    );
}
