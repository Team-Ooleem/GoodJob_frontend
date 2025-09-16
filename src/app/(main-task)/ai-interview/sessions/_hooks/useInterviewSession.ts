import { useState, useRef, useEffect } from 'react';
import { message } from 'antd';
import { useInterviewAnalysis } from '@/hooks/use-interview-analysis';
import { blobToBase64 } from '@/utils/audio';
import { WavRecorder } from '@/utils/audio/WavRecorder';
import { InterviewAPI } from '../_apis/interview-api';
import { QuestionDto } from './useQuestionManager';
import { useTTSManager } from './useTTSManager';
import { ProcessingStep } from '../_components/ProcessingPopup';

export interface AudioFeatures {
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

export interface InterviewSession {
    questionNumber: number;
    question: string;
    answer: string;
    timeSpent: number;
    detectionData: any[];
    timestamp: Date;
    audioUrl?: string;
    audioFeatures?: AudioFeatures;
}

interface UseInterviewSessionProps {
    questionManager: {
        currentIndex: number;
        questionText: string;
        questionId: string;
        persistId: string;
        addQuestion: (question: QuestionDto) => void;
        moveToNext: () => void;
        isLastQuestion: (maxQuestions: number) => boolean;
    };
    ttsManager: ReturnType<typeof useTTSManager>;
    maxQuestions: number;
    sessionId: string;
    webcamRef: React.RefObject<any>;
}

/**
 * 면접 세션 관리를 위한 커스텀 훅
 * 녹음, 답변 완료, 면접 완료 등의 로직을 담당
 */
export const useInterviewSession = ({
    questionManager,
    ttsManager,
    maxQuestions,
    sessionId,
    webcamRef,
}: UseInterviewSessionProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
    const [detectionHistory, setDetectionHistory] = useState<any[]>([]);
    const [transcribedText, setTranscribedText] = useState('');
    const [qaList, setQaList] = useState<Array<{ question: string; answer: string }>>([]);
    const [isCompleting, setIsCompleting] = useState(false);
    const [showProcessingPopup, setShowProcessingPopup] = useState(false);
    const [currentProcessingStep, setCurrentProcessingStep] = useState<ProcessingStep | null>(null);
    const [countdown, setCountdown] = useState(10);
    const [isCountdownActive, setIsCountdownActive] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const completingRef = useRef(false);
    const recorderRef = useRef<WavRecorder | null>(null);
    const lastAudioBlobRef = useRef<Blob | null>(null);
    const bypassLeaveGuardRef = useRef(false);

    const interviewAnalysisMutation = useInterviewAnalysis();

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

    // 카운트다운 타이머 관리
    const startCountdown = () => {
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
        }

        setIsCountdownActive(true);
        setCountdown(10);

        countdownTimerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownTimerRef.current!);
                    setIsCountdownActive(false);
                    handleStartAnswer();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopCountdown = () => {
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        setIsCountdownActive(false);
        setCountdown(10);
    };

    // TTS 완료 후 바로 답변 시작
    const handleTTSComplete = () => {
        // 10초 카운트다운 후 자동으로 답변 시작
        startCountdown();
    };

    // 사용자가 시작 버튼을 눌렀을 때 (카운트다운 중단)
    const handleUserStartAnswer = () => {
        stopCountdown();
        handleStartAnswer();
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

        // ttsManager.simulateAISpeaking(2000); // 답변 시작 시 시뮬레이션 제거
    };

    // 답변 완료
    const handleCompleteAnswer = async () => {
        if (completingRef.current) return;
        completingRef.current = true;

        let completedSession: InterviewSession | null = null;

        try {
            stopTimer();
            setIsRecording(false);
            setShowProcessingPopup(true);

            // 웹캠 집계
            setCurrentProcessingStep('webcam-upload');
            const agg = webcamRef.current?.endQuestion();
            if (agg) {
                try {
                    await InterviewAPI.uploadWebcamAggregate(
                        sessionId,
                        questionManager.persistId,
                        agg,
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
                    setCurrentProcessingStep('audio-analysis');
                    try {
                        await InterviewAPI.analyzeAudio(sessionId, questionManager.persistId, blob);
                    } catch (e) {
                        console.warn('백엔드를 통한 음성 분석 실패:', e);
                    }

                    // Google STT
                    setCurrentProcessingStep('stt-transcription');
                    try {
                        sttTranscript = await InterviewAPI.transcribeWithGoogleSTT(blob);
                    } catch (e) {
                        console.warn('Google STT 전사 실패:', e);
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

                // 새 백엔드: 문항별 내용/맥락 분석 트리거 (비차단)
                setCurrentProcessingStep('content-analysis');
                try {
                    await InterviewAPI.analyzeQuestionContent(
                        sessionId,
                        questionManager.persistId,
                        finalAnswer,
                        qaList,
                    );
                } catch (e) {
                    console.warn('문항 내용/맥락 분석 업로드 실패(진행 계속):', e);
                }

                // 다음 질문 처리
                if (!questionManager.isLastQuestion(maxQuestions)) {
                    setCurrentProcessingStep('next-question');
                    try {
                        const originalQuestion: QuestionDto = {
                            id: questionManager.persistId,
                            text: questionManager.questionText,
                        };

                        const nextQuestion = await InterviewAPI.fetchFollowup(
                            originalQuestion,
                            finalAnswer,
                        );
                        questionManager.addQuestion(nextQuestion);

                        // 다음 질문이 있으므로 finalizing 대신 next-question 유지
                        setTimeout(() => {
                            questionManager.moveToNext();
                            setTimeLeft(60);
                            ttsManager.speakQuestion(nextQuestion.text, nextQuestion.id, () => {
                                // TTS 완료 후 시작 버튼 표시
                                handleTTSComplete();
                            });
                        }, 1000);
                    } catch (error) {
                        console.warn('꼬리질문 생성 실패:', error);

                        const fallback: QuestionDto = {
                            id: `fallback_${Date.now()}`,
                            text: '이전 답변에서 수치/성과를 확인할 수 있는 사례를 하나 제시해 주세요.',
                        };
                        questionManager.addQuestion(fallback);

                        // fallback 질문이 있으므로 finalizing 대신 next-question 유지
                        setTimeout(() => {
                            questionManager.moveToNext();
                            setTimeLeft(60);
                            ttsManager.speakQuestion(fallback.text, fallback.id, () => {
                                // TTS 완료 후 시작 버튼 표시
                                handleTTSComplete();
                            });
                        }, 1000);
                    }
                } else {
                    setCurrentProcessingStep('finalizing');
                    message.success('모든 답변이 완료되었습니다!');
                    setTimeout(() => {
                        handleInterviewCompletion([...sessions, completedSession!]);
                    }, 1000);
                }
            }

            setTranscribedText('');
        } finally {
            completingRef.current = false;
            // 로딩 팝업 닫기 (약간의 지연 후)
            setTimeout(() => {
                setShowProcessingPopup(false);
                setCurrentProcessingStep(null);
            }, 1000);
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
            serverAudioData = await InterviewAPI.getServerAudioData(sessionId);
            if (serverAudioData) {
                console.log('서버에서 음성 지표 로드 성공:', serverAudioData);
                localStorage.setItem(
                    'interviewAudioOverallServer',
                    JSON.stringify(serverAudioData),
                );
            }
        } catch (e) {
            console.warn('서버 음성 지표 로드 실패:', e);
        }

        // 문항별 음성 지표도 서버에서 가져오기
        let serverAudioPerQuestion = null;
        try {
            serverAudioPerQuestion = await InterviewAPI.getServerAudioPerQuestion(sessionId);
            if (serverAudioPerQuestion) {
                console.log('서버에서 문항별 음성 지표 로드 성공:', serverAudioPerQuestion);
                localStorage.setItem(
                    'interviewAudioPerQuestionServer',
                    JSON.stringify(serverAudioPerQuestion),
                );
            }
        } catch (e) {
            console.warn('서버 문항별 음성 지표 로드 실패:', e);
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
            const visualAgg = await InterviewAPI.finalizeSession(sessionId);
            if (visualAgg) {
                localStorage.setItem(
                    'interviewVisualPerQuestion',
                    JSON.stringify(visualAgg.perQuestion),
                );
                localStorage.setItem('interviewVisualOverall', JSON.stringify(visualAgg.overall));
            }
        } catch (e: any) {
            console.warn('세션 영상 집계 finalize 실패:', e);
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
            const analysisData = await InterviewAPI.analyzeInterviewResult(sessionId, latestQAList);
            if (analysisData) {
                localStorage.setItem('interviewAnalysis', JSON.stringify(analysisData));
            }

            // 분석 완료 후 즉시 결과 페이지로 이동
            message.success('면접 분석이 완료되었습니다! 결과 페이지로 이동합니다.');
            setTimeout(() => {
                bypassLeaveGuardRef.current = true;
                window.location.href = '/ai-interview/result';
            }, 2000); // 2초 후 이동 (사용자가 메시지를 확인할 시간)
        } catch (error) {
            console.error('리포트 분석 호출 실패:', error);
            // 분석 실패해도 결과 페이지로 이동 (기존 데이터로 표시)
            message.warning('분석 중 오류가 발생했지만 결과를 확인할 수 있습니다.');
            setTimeout(() => {
                bypassLeaveGuardRef.current = true;
                window.location.href = '/ai-interview/result';
            }, 2000);
        } finally {
            message.destroy();
            try {
                localStorage.setItem('interviewQA', JSON.stringify(latestQAList));
            } catch {}
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

    // 세션 이탈 방어
    useEffect(() => {
        const inProgress = () =>
            !bypassLeaveGuardRef.current &&
            (isRecording || !!currentSession || sessions.length > 0);

        const beforeUnload = (e: BeforeUnloadEvent) => {
            if (inProgress()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const pushDummy = () => {
            try {
                history.pushState(null, '', location.href);
            } catch {}
        };
        const onPopState = (e: PopStateEvent) => {
            if (!inProgress()) return;
            const ok = confirm(
                '면접이 진행 중입니다. 이탈하면 진행 내용이 사라질 수 있어요. 이동하시겠습니까?',
            );
            if (!ok) {
                pushDummy();
            }
        };

        window.addEventListener('beforeunload', beforeUnload);
        pushDummy();
        window.addEventListener('popstate', onPopState);
        return () => {
            window.removeEventListener('beforeunload', beforeUnload);
            window.removeEventListener('popstate', onPopState);
        };
    }, [isRecording, currentSession, sessions.length]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            ttsManager.cleanup();
        };
    }, []);

    return {
        isRecording,
        timeLeft,
        sessions,
        currentSession,
        detectionHistory,
        transcribedText,
        qaList,
        isCompleting,
        showProcessingPopup,
        currentProcessingStep,
        countdown,
        isCountdownActive,
        handleStartAnswer,
        handleCompleteAnswer,
        handleDetection,
        handleTTSComplete,
        handleUserStartAnswer,
        bypassLeaveGuardRef,
    };
};
