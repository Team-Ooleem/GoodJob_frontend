'use client';

import { useEffect, useRef, useState } from 'react';
import { Webcam, WebcamHandle, Question, ProcessingPopup, CompletionPopup } from './_components';
import { useQuestionManager } from './_hooks/useQuestionManager';
import { useTTSManager } from './_hooks/useTTSManager';
import { useInterviewSession } from './_hooks/useInterviewSession';
import { InterviewAPI } from './_apis/interview-api';
import { InfoCircleOutlined } from '@ant-design/icons';

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

export default function AiInterviewSessionsPage() {
    const MAX_QUESTIONS = 3;

    // 준비 상태 관리
    const [isReady, setIsReady] = useState(false);
    const [showReadyModal, setShowReadyModal] = useState(true);
    // 인사 멘트 TTS 제어
    const [introPlayed, setIntroPlayed] = useState(false);
    const [introDone, setIntroDone] = useState(false);
    const [firstQuestionSpoken, setFirstQuestionSpoken] = useState(false);
    const [greetingText, setGreetingText] = useState<string | null>(null);

    // 커스텀 훅 사용
    const questionManager = useQuestionManager();
    const ttsManager = useTTSManager();

    const webcamRef = useRef<WebcamHandle>(null);
    const sessionIdRef = useRef<string>(
        typeof window !== 'undefined'
            ? localStorage.getItem('aiInterviewSessionId') ||
                  `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`
            : `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
    );
    const SESSION_ID = sessionIdRef.current as string;

    const interviewSession = useInterviewSession({
        questionManager,
        ttsManager,
        maxQuestions: MAX_QUESTIONS,
        sessionId: SESSION_ID,
        webcamRef,
    });

    // 질문 초기화 (개발모드 StrictMode 중복 실행 방지 가드) + 인사 멘트 준비
    const initAskedRef = useRef(false);
    useEffect(() => {
        const initializeFirstQuestion = async () => {
            try {
                localStorage.setItem('aiInterviewSessionId', SESSION_ID);

                questionManager.setIsLoading(true);
                const firstQuestion = await InterviewAPI.fetchFirstQuestion();
                questionManager.addQuestion(firstQuestion);
            } catch (error) {
                console.warn('첫 질문 생성 실패:', error);

                const fallbackQuestion = {
                    id: 'q1_fallback',
                    text: interviewData.questions[0],
                };

                questionManager.addQuestion(fallbackQuestion);
            } finally {
                questionManager.setIsLoading(false);
            }
        };

        if (!initAskedRef.current) {
            initAskedRef.current = true;
            // 선택 페이지에서 저장된 채용공고 메타를 읽어 인사 멘트 구성
            try {
                const raw = sessionStorage.getItem('jobPostMeta');
                if (raw) {
                    const meta = JSON.parse(raw) as any;
                    const company: string | undefined = meta?.summaryJson?.company || meta?.company;
                    const jobTitle: string | undefined = meta?.summaryJson?.jobTitle;
                    if (company && jobTitle) {
                        setGreetingText(
                            `안녕하십니까, 이번 ${company.toLowerCase()}의 ${jobTitle} 직무 채용에 지원해 주셔서 감사합니다. 긴장하지 마시고, 차분하게 면접에 임해 주시면 좋겠습니다. 그러면, 시작하겠습니다.`,
                        );
                    } else {
                        setGreetingText(
                            '안녕하십니까, 이번 채용에 지원해 주셔서 감사합니다. 긴장하지 마시고, 차분하게 면접에 임해 주시면 좋겠습니다. 그러면, 시작하겠습니다.',
                        );
                    }
                } else {
                    setGreetingText(
                        '안녕하십니까, 이번 채용에 지원해 주셔서 감사합니다. 긴장하지 마시고, 차분하게 면접에 임해 주시면 좋겠습니다. 그러면, 시작하겠습니다.',
                    );
                }
            } catch {
                setGreetingText(
                    '안녕하십니까, 이번 채용에 지원해 주셔서 감사합니다. 긴장하지 마시고, 차분하게 면접에 임해 주시면 좋겠습니다. 그러면, 시작하겠습니다.',
                );
            }
            initializeFirstQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 준비 완료 시: 인사 멘트 → 첫 질문 순서로 TTS 수행
    useEffect(() => {
        if (!isReady) return;

        // 1) 인사 멘트 미재생이면 먼저 재생
        if (!introPlayed) {
            if (greetingText && greetingText.trim()) {
                ttsManager.speakQuestion(greetingText, 'intro', () => {
                    setIntroDone(true);
                });
            } else {
                setIntroDone(true);
            }
            setIntroPlayed(true);
            return;
        }

        // 2) 인사 멘트 완료 후 첫 질문 재생 (한 번만)
        if (
            introDone &&
            !firstQuestionSpoken &&
            questionManager.hasCurrentQuestion &&
            questionManager.questionText
        ) {
            ttsManager.speakQuestion(
                questionManager.questionText,
                questionManager.questionId,
                () => {
                    interviewSession.handleTTSComplete();
                },
            );
            setFirstQuestionSpoken(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isReady,
        introPlayed,
        introDone,
        questionManager.hasCurrentQuestion,
        questionManager.questionText,
    ]);

    const handleStartInterview = () => {
        setIsReady(true);
        setShowReadyModal(false);
    };

    // 자동 TTS (두 번째 질문부터)
    useEffect(() => {
        const autoSpeak = process.env.NEXT_PUBLIC_AUTO_SPEAK_ON_QUESTION_READY !== 'false';
        if (!autoSpeak) return;
        if (!questionManager.hasCurrentQuestion) return;
        if (questionManager.questions.length === 0) return;
        if (questionManager.currentIndex === 0 && !isReady) return; // 첫 질문은 준비 완료 후에만
        if (!questionManager.questionText) return;

        const speakQuestionAsync = async () => {
            try {
                await ttsManager.speakQuestion(
                    questionManager.questionText,
                    questionManager.questionId,
                    () => {
                        // TTS 완료 후 시작 버튼 표시
                        interviewSession.handleTTSComplete();
                    },
                );
            } catch (e) {
                console.warn('자동 질문 읽기 실패:', e);
            }
        };

        speakQuestionAsync();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionManager.currentIndex, questionManager.hasCurrentQuestion]);

    return (
        <div className='w-screen h-screen flex flex-col justify-end items-center  bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden pb-16'>
            {/* 준비 모달 */}
            {showReadyModal && (
                <div className='absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-[3000]'>
                    <div className='bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform transition-all duration-300 scale-100'>
                        <div className='text-center'>
                            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <svg
                                    className='w-8 h-8 text-blue-600'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                                    />
                                </svg>
                            </div>
                            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                                면접 준비 완료
                            </h2>
                            <p className='text-gray-600 mb-6'>
                                곧 AI 면접이 시작됩니다.
                                <br />
                                준비가 되시면 시작 버튼을 눌러주세요.
                            </p>
                            <button
                                onClick={handleStartInterview}
                                className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200'
                            >
                                면접 시작하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* 가운데 웹캠 */}
            <div className='absolute top-[100px] left-1/2 transform -translate-x-1/2 z-10'>
                <Webcam
                    ref={webcamRef}
                    width={720}
                    height={405}
                    onDetection={interviewSession.handleDetection}
                />
            </div>

            {/* 질문 영역 - 항상 일정한 높이 유지 */}
            <div className='w-full flex justify-center items-center'>
                <Question
                    question={questionManager.questionText}
                    questionNumber={questionManager.currentIndex + 1}
                    totalQuestions={MAX_QUESTIONS}
                    isRecording={interviewSession.isRecording}
                    timeLeft={interviewSession.timeLeft}
                    hasCurrentQuestion={questionManager.hasCurrentQuestion}
                    onStartAnswer={interviewSession.handleUserStartAnswer}
                    onCompleteAnswer={interviewSession.handleCompleteAnswer}
                />
            </div>

            {/* 로딩 상태 표시 */}
            {questionManager.isLoading && (
                <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
                    <div className='text-lg'>질문을 준비 중입니다...</div>
                </div>
            )}

            {/* 툴팁 메세지 */}
            <div className='absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-4 border border-gray-200 shadow-md'>
                <p className='text-sm text-gray-600 flex items-center gap-2'>
                    <InfoCircleOutlined />
                    <span className='font-medium text-sky-500'>
                        화면의 내 모습을 보면서 질문에 답변해주세요.
                    </span>
                </p>
            </div>

            {/* TTS 시 검정 그라데이션 배경 애니메이션 */}
            {ttsManager.isSpeaking && !interviewSession.isRecording && (
                <div className='absolute inset-0 bg-gradient-to-br from-black/20 via-gray-900/30 to-black/20 pointer-events-none z-[2000]'>
                    {/* 세로 선들 - 가운데 정렬 */}
                    <div className='absolute inset-0 flex justify-center items-center'>
                        <div className='flex items-center gap-1'>
                            {/* 왼쪽 선들 */}
                            <div
                                className='w-1 bg-white/60 rounded-full'
                                style={{
                                    height: '3em',
                                    animation: 'heightPulse 1.5s ease-in-out infinite',
                                    animationDelay: '0s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/50 rounded-full'
                                style={{
                                    height: '2.5em',
                                    animation: 'heightPulse 1.3s ease-in-out infinite',
                                    animationDelay: '0.1s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/70 rounded-full'
                                style={{
                                    height: '4em',
                                    animation: 'heightPulse 1.7s ease-in-out infinite',
                                    animationDelay: '0.2s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/40 rounded-full'
                                style={{
                                    height: '2em',
                                    animation: 'heightPulse 1.2s ease-in-out infinite',
                                    animationDelay: '0.3s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/55 rounded-full'
                                style={{
                                    height: '3.5em',
                                    animation: 'heightPulse 1.6s ease-in-out infinite',
                                    animationDelay: '0.4s',
                                }}
                            ></div>

                            {/* 가운데 메인 선들 */}
                            <div
                                className='w-1.5 bg-white/80 rounded-full'
                                style={{
                                    height: '5em',
                                    animation: 'heightPulse 1.4s ease-in-out infinite',
                                    animationDelay: '0.05s',
                                }}
                            ></div>
                            <div
                                className='w-1.5 bg-white/90 rounded-full'
                                style={{
                                    height: '4.5em',
                                    animation: 'heightPulse 1.8s ease-in-out infinite',
                                    animationDelay: '0.15s',
                                }}
                            ></div>
                            <div
                                className='w-1.5 bg-white/85 rounded-full'
                                style={{
                                    height: '5.5em',
                                    animation: 'heightPulse 1.5s ease-in-out infinite',
                                    animationDelay: '0.25s',
                                }}
                            ></div>
                            <div
                                className='w-1.5 bg-white/75 rounded-full'
                                style={{
                                    height: '4.8em',
                                    animation: 'heightPulse 1.3s ease-in-out infinite',
                                    animationDelay: '0.35s',
                                }}
                            ></div>
                            <div
                                className='w-1.5 bg-white/95 rounded-full'
                                style={{
                                    height: '5.2em',
                                    animation: 'heightPulse 1.6s ease-in-out infinite',
                                    animationDelay: '0.45s',
                                }}
                            ></div>

                            {/* 오른쪽 선들 */}
                            <div
                                className='w-1 bg-white/50 rounded-full'
                                style={{
                                    height: '2.8em',
                                    animation: 'heightPulse 1.4s ease-in-out infinite',
                                    animationDelay: '0.5s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/60 rounded-full'
                                style={{
                                    height: '3.2em',
                                    animation: 'heightPulse 1.7s ease-in-out infinite',
                                    animationDelay: '0.6s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/45 rounded-full'
                                style={{
                                    height: '2.2em',
                                    animation: 'heightPulse 1.1s ease-in-out infinite',
                                    animationDelay: '0.7s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/55 rounded-full'
                                style={{
                                    height: '3.8em',
                                    animation: 'heightPulse 1.5s ease-in-out infinite',
                                    animationDelay: '0.8s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/65 rounded-full'
                                style={{
                                    height: '2.6em',
                                    animation: 'heightPulse 1.3s ease-in-out infinite',
                                    animationDelay: '0.9s',
                                }}
                            ></div>
                            <div
                                className='w-1 bg-white/50 rounded-full'
                                style={{
                                    height: '4.2em',
                                    animation: 'heightPulse 1.8s ease-in-out infinite',
                                    animationDelay: '1.0s',
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* 카운트다운 표시 */}
            {interviewSession.isCountdownActive && !interviewSession.isRecording && (
                <div className='absolute top-20 left-1/2 transform -translate-x-1/2 z-[2500]'>
                    <div className='bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg text-center'>
                        <div className='text-2xl font-bold mb-1'>
                            {interviewSession.countdown}초
                        </div>
                        <div className='text-sm'>자동으로 답변이 시작됩니다</div>
                    </div>
                </div>
            )}

            {/* 화면 하단 초록색 마이크 애니메이션 */}
            <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full'>
                <div className='w-full h-16 bg-green-400/20 rounded-full blur-xl animate-pulse translate-y-1/2'></div>
                <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[256px] h-[8px] bg-green-300 rounded-full'></div>
            </div>

            {/* 처리 중 팝업 */}
            <ProcessingPopup
                isVisible={interviewSession.showProcessingPopup}
                currentStep={interviewSession.currentProcessingStep}
                onComplete={() => {
                    // 팝업 완료 시 추가 처리 (필요시)
                }}
            />

            {/* 완료 팝업 */}
            <CompletionPopup
                isVisible={interviewSession.showCompletionPopup}
                onClose={() => {
                    // 완료 팝업 닫기 (필요시)
                }}
            />
        </div>
    );
}
