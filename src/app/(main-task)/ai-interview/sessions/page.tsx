'use client';

import { useState, useEffect, useRef } from 'react';
import { Webcam, WebcamHandle, Question, Avatar } from '../_components';
import { message } from 'antd';
import { useInterviewAnalysis } from '@/hooks/use-interview-analysis';
import axios from 'axios';

// ===== 추가: WAV 레코더 유틸 =====
class WavRecorder {
    private audioCtx: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private buffers: Float32Array[] = [];
    private recording = false;

    async start() {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.source = this.audioCtx.createMediaStreamSource(this.stream);
        this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
        this.source.connect(this.processor);
        this.processor.connect(this.audioCtx.destination);
        this.buffers = [];
        this.recording = true;

        this.processor.onaudioprocess = (e) => {
            if (!this.recording) return;
            const ch0 = e.inputBuffer.getChannelData(0);
            this.buffers.push(new Float32Array(ch0));
        };
    }

    async stop(): Promise<Blob> {
        this.recording = false;
        if (this.processor) this.processor.disconnect();
        if (this.source) this.source.disconnect();
        if (this.stream) this.stream.getTracks().forEach((t) => t.stop());

        const sr = this.audioCtx?.sampleRate || 44100;
        const samples = this.merge(this.buffers);
        const wav = this.encodeWAV(samples, sr);
        if (this.audioCtx) await this.audioCtx.close();
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

interface AudioFeatures {
    f0_mean: number;
    f0_std: number;
    f0_cv?: number;
    f0_std_semitone?: number;
    rms_std: number;
    rms_cv: number;
    jitter_like: number;
    shimmer_like: number;
    silence_ratio: number;
    sr: number;
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

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);

    const webcamRef = useRef<WebcamHandle>(null);

    // ===== 추가: WAV 레코더 인스턴스 & 최신 오디오 Blob 참조 =====
    const recorderRef = useRef<WavRecorder | null>(null);
    const lastAudioBlobRef = useRef<Blob | null>(null);

    // 컴포넌트 내부: 세션ID를 한 번 생성해 유지 (uuid 없어도 OK)
    const sessionIdRef = useRef<string>(
        `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
    );
    const SESSION_ID = sessionIdRef.current as any as string;
    // 질문ID는 q1/q2/... 형태로 쓸게요.
    const qid = `q${currentQuestionIndex + 1}`;
    const qtext = interviewData.questions[currentQuestionIndex];

    // react-query hook
    const interviewAnalysisMutation = useInterviewAnalysis();

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
    const AUDIO_API_BASE = process.env.NEXT_PUBLIC_AUDIO_API_BASE; // 예: http://localhost:8081

    const analyzeAudioBlob = async (
        blob: Blob,
        filename = 'answer.wav',
    ): Promise<AudioFeatures> => {
        if (!AUDIO_API_BASE) throw new Error('NEXT_PUBLIC_AUDIO_API_BASE가 설정되지 않았습니다.');
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
    const handleInterviewCompletion = async () => {
        // 최신 qaList를 가져오기 위해 sessions에서 재구성
        const latestQAList = sessions.map((session) => ({
            question: session.question,
            answer: session.answer,
        }));

        // (선택) 오디오 종합 평균 같은 간단 요약 만들기
        const audioAgg = (() => {
            const feats = sessions.map((s) => s.audioFeatures).filter(Boolean) as AudioFeatures[];
            const mean = (arr: number[]) =>
                arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
            return {
                f0_mean: mean(feats.map((f) => f.f0_mean)),
                f0_std: mean(feats.map((f) => f.f0_std)),
                rms_cv: mean(feats.map((f) => f.rms_cv)),
                jitter_like: mean(feats.map((f) => f.jitter_like)),
                shimmer_like: mean(feats.map((f) => f.shimmer_like)),
                silence_ratio: mean(feats.map((f) => f.silence_ratio)),
            };
        })();

        // 결과를 로컬에 보관(결과 페이지에서 활용)
        localStorage.setItem(
            'interviewAudioPerQuestion',
            JSON.stringify(
                sessions.map((s) => ({
                    questionNumber: s.questionNumber,
                    question: s.question,
                    audioFeatures: s.audioFeatures,
                    audioUrl: s.audioUrl,
                })),
            ),
        );
        localStorage.setItem('interviewAudioOverall', JSON.stringify(audioAgg));

        try {
            const finalizeRes = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/metrics/${SESSION_ID}/finalize`,
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
                url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/metrics/${SESSION_ID}/finalize`,
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
            console.log(
                '📡 API 엔드포인트:',
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/interview/analyze`,
            );
            console.log('📋 요청 메서드: POST');
            console.log('📦 요청 헤더:', {
                'Content-Type': 'application/json',
            });
            console.log('📄 요청 바디:', JSON.stringify(requestData, null, 2));
            console.log('=====================================');

            // 백엔드 개발자용 cURL 명령어 예시
            console.log('🔧 백엔드 개발자용 cURL 명령어:');
            console.log('=====================================');
            console.log(
                `curl -X POST "${process.env.NEXT_PUBLIC_API_BASE_URL}/interview/analyze" \\`,
            );
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
            }, 20000); // 테스트 용도로 일단 20초, 원래 2초였음
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
            }, 20000); // 테스트 용도로 일단 20초, 원래 2초였음
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
            question: interviewData.questions[currentQuestionIndex],
            answer: '',
            timeSpent: 0,
            detectionData: [],
            timestamp: new Date(),
        };
        setCurrentSession(newSession);

        // ▼ 문항 시작: 웹캠에 문항 메타 전달
        webcamRef.current?.startQuestion(qid, { orderNo: currentQuestionIndex + 1, text: qtext });

        // 실제 음성 인식 시작 (기존 설정 유지)
        startSpeechRecognition();

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
        stopTimer();
        setIsRecording(false);

        // 음성 인식 중지
        stopSpeechRecognition();

        // ▼ 문항 종료: 집계 결과 받기 & 서버로 전송
        const qid = `q${currentQuestionIndex + 1}`;
        const agg = webcamRef.current?.endQuestion();
        if (agg) {
            try {
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/metrics/${SESSION_ID}/${qid}/aggregate`,
                    agg,
                    { timeout: 10000 },
                );
            } catch (e) {
                console.warn('문항 영상 집계 업로드 실패:', e);
            }
        }

        // WAV 정지 → 업로드 분석
        let audioUrl: string | undefined;
        let audioFeatures: AudioFeatures | undefined;

        try {
            if (recorderRef.current) {
                const blob = await recorderRef.current.stop();
                lastAudioBlobRef.current = blob;
                audioUrl = URL.createObjectURL(blob);

                // 오디오 분석 서버 호출
                audioFeatures = await analyzeAudioBlob(blob, `q${currentQuestionIndex + 1}.wav`);
            }
        } catch (e) {
            console.error('오디오 분석 실패:', e);
            message.warning('오디오 분석에 실패했어요. 네트워크를 확인해주세요.');
        } finally {
            recorderRef.current = null;
        }

        if (currentSession) {
            const finalAnswer = transcribedText || `답변 ${currentSession.questionNumber}번 완료`;

            const completedSession = {
                ...currentSession,
                answer: finalAnswer,
                timeSpent: 60 - timeLeft,
                audioUrl,
                audioFeatures,
            };

            setSessions((prev) => [...prev, completedSession]);

            // 질문-답변 리스트에 추가
            setQaList((prev) => [
                ...prev,
                {
                    question: currentSession.question,
                    answer: finalAnswer,
                },
            ]);

            setCurrentSession(null);
        }

        // 음성 인식 텍스트 초기화
        setTranscribedText('');

        // 다음 질문으로 이동 또는 면접 완료
        if (currentQuestionIndex < interviewData.questions.length - 1) {
            // 일반 질문 완료 - 다음 질문으로 이동
            setTimeout(() => {
                setCurrentQuestionIndex((prev) => prev + 1);
                setTimeLeft(60);
                simulateAISpeaking(1500);
            }, 2000);
        } else {
            // 마지막 질문 완료 - 면접 완료 처리
            message.success('모든 답변이 완료되었습니다!');
            setTimeout(() => {
                handleInterviewCompletion();
            }, 2000);
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

    // 컴포넌트 마운트 시 AI 인사말 및 Web Speech API 초기화
    useEffect(() => {
        simulateAISpeaking(3000);
        initializeSpeechRecognition();
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

            {/* 질문 */}
            {currentQuestionIndex < interviewData.questions.length && (
                <Question
                    question={interviewData.questions[currentQuestionIndex]}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={interviewData.questions.length}
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
                        진행률:{' '}
                        {Math.round(
                            ((currentQuestionIndex + 1) / interviewData.questions.length) * 100,
                        )}
                        %
                    </div>
                    <div>완료된 질문: {sessions.length}</div>
                    <div>감지된 피드백: {detectionHistory.length}</div>
                </div>
            </div>
        </div>
    );
}
