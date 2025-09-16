'use client';

import { useEffect, useRef } from 'react';
import { Webcam, WebcamHandle, Question, Avatar } from './_components';
import { useQuestionManager } from './_hooks/useQuestionManager';
import { useTTSManager } from './_hooks/useTTSManager';
import { useInterviewSession } from './_hooks/useInterviewSession';
import { InterviewAPI } from './_apis/interview-api';

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

    // 질문 초기화 (개발모드 StrictMode 중복 실행 방지 가드)
    const initAskedRef = useRef(false);
    useEffect(() => {
        const initializeFirstQuestion = async () => {
            try {
                localStorage.setItem('aiInterviewSessionId', SESSION_ID);

                questionManager.setIsLoading(true);
                const firstQuestion = await InterviewAPI.fetchFirstQuestion();
                questionManager.addQuestion(firstQuestion);

                // 첫 질문 TTS 실행
                setTimeout(() => {
                    if (firstQuestion.text) {
                        ttsManager.speakQuestion(firstQuestion.text, firstQuestion.id);
                    }
                }, 100);
            } catch (error) {
                console.warn('첫 질문 생성 실패:', error);

                const fallbackQuestion = {
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

        if (!initAskedRef.current) {
            initAskedRef.current = true;
            initializeFirstQuestion();
        }
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

    return (
        <div className='w-screen h-screen flex flex-col justify-end items-center bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 relative overflow-hidden'>
            <Webcam
                ref={webcamRef}
                css='absolute top-0 right-0'
                onDetection={interviewSession.handleDetection}
            />

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
                    isRecording={interviewSession.isRecording}
                    timeLeft={interviewSession.timeLeft}
                    onStartAnswer={interviewSession.handleStartAnswer}
                    onCompleteAnswer={interviewSession.handleCompleteAnswer}
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
                    <div>완료된 질문: {interviewSession.sessions.length}</div>
                    <div>감지된 피드백: {interviewSession.detectionHistory.length}</div>
                </div>
            </div>
        </div>
    );
}
