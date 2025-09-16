'use client';

import { useState, useEffect } from 'react';
import { Button, Typography, Progress } from 'antd';
import { AudioOutlined, CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface QuestionProps {
    question: string;
    questionNumber: number;
    totalQuestions: number;
    isRecording: boolean;
    timeLeft: number;
    hasCurrentQuestion: boolean;
    onStartAnswer: () => void;
    onCompleteAnswer: () => void;
}

export function Question({
    question,
    questionNumber,
    totalQuestions,
    isRecording,
    timeLeft,
    hasCurrentQuestion,
    onStartAnswer,
    onCompleteAnswer,
}: QuestionProps) {
    const [hasStarted, setHasStarted] = useState(false);

    // 질문이 바뀔 때마다 hasStarted 상태 초기화
    useEffect(() => {
        setHasStarted(false);
    }, [questionNumber]);

    // isRecording이 true가 되면 hasStarted도 true로 설정
    useEffect(() => {
        if (isRecording) {
            setHasStarted(true);
        }
    }, [isRecording]);

    const handleStart = () => {
        setHasStarted(true);
        onStartAnswer();
    };

    const handleComplete = () => {
        onCompleteAnswer();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className='w-[80%] min-h-[228px] bg-white rounded-2xl p-8 flex flex-col justify-between shadow-lg shadow-gray-300'>
            {hasCurrentQuestion && (
                <>
                    {/* 질문 영역 */}
                    <div className='flex-1 flex flex-col justify-center'>
                        <div className='text-center mb-6'>
                            <h2 className='text-3xl font-bold text-gray-800'>Q{questionNumber}.</h2>
                            <p className='text-xl text-gray-700 block mt-4 leading-relaxed'>
                                {question}
                            </p>
                        </div>

                        {/* 타이머 표시 */}
                        {(hasStarted || isRecording) && (
                            <div
                                className={`fixed top-5 right-5 z-50 font-bold transition-all duration-1000 ease-out ${
                                    timeLeft <= 0
                                        ? 'text-red-500'
                                        : timeLeft <= 10
                                          ? 'text-red-500 timer-shake'
                                          : timeLeft <= 20
                                            ? 'text-orange-500'
                                            : 'text-blue-500'
                                }`}
                                style={{
                                    fontSize:
                                        timeLeft <= 0
                                            ? '1.5rem'
                                            : timeLeft <= 10
                                              ? '1.5rem'
                                              : timeLeft <= 20
                                                ? '2rem'
                                                : '3rem',
                                }}
                            >
                                {formatTime(timeLeft)}
                            </div>
                        )}
                    </div>

                    {/* 버튼 영역 */}
                    <div className='relative flex justify-center'>
                        {!hasStarted ? (
                            <Button
                                type='primary'
                                size='large'
                                icon={<AudioOutlined />}
                                onClick={handleStart}
                                className='h-14 px-10 text-xl font-semibold absolute left-1/2 -translate-x-1/2'
                            >
                                시작
                            </Button>
                        ) : (
                            <Button
                                type='primary'
                                size='large'
                                icon={<CheckOutlined />}
                                onClick={handleComplete}
                                className='h-14 px-10 text-xl font-semibold bg-green-500 hover:bg-green-600 absolute left-1/2 -translate-x-1/2'
                            >
                                완료
                            </Button>
                        )}

                        <div className='ml-auto'>
                            <div className='bg-sky-500 text-white px-3 py-2 rounded-lg shadow-lg'>
                                <div className='text-sm font-medium text-center'>
                                    질문 {questionNumber} / {totalQuestions}
                                </div>
                                <div className='text-xs text-blue-100 text-center mt-1'>
                                    {Math.round((questionNumber / totalQuestions) * 100)}% 완료
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
