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
    onStartAnswer: () => void;
    onCompleteAnswer: () => void;
}

export function Question({
    question,
    questionNumber,
    totalQuestions,
    timeLeft,
    onStartAnswer,
    onCompleteAnswer,
}: QuestionProps) {
    const [hasStarted, setHasStarted] = useState(false);

    // 질문이 바뀔 때마다 hasStarted 상태 초기화
    useEffect(() => {
        setHasStarted(false);
    }, [questionNumber]);

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
        <div className='w-[calc(100%-18rem)] bg-white rounded-tl-2xl rounded-tr-2xl p-8 flex flex-col justify-between'>
            {/* 질문 영역 */}
            <div className='flex-1 flex flex-col justify-center'>
                <div className='text-center mb-6'>
                    <h2 className='text-4xl font-bold text-gray-800'>Q{questionNumber}.</h2>
                    <p className='text-2xl text-gray-700 block mt-4 leading-relaxed'>{question}</p>
                </div>

                {/* 타이머 표시 */}
                {hasStarted && (
                    <div className='text-center mb-4'>
                        <div className='text-5xl font-bold text-blue-600 mb-2'>
                            {formatTime(timeLeft)}
                        </div>
                        <Progress
                            percent={((60 - timeLeft) / 60) * 100}
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                            showInfo={false}
                            className='w-full max-w-md mx-auto'
                        />
                    </div>
                )}
            </div>

            {/* 버튼 영역 */}
            <div className='flex justify-center'>
                {!hasStarted ? (
                    <Button
                        type='primary'
                        size='large'
                        icon={<AudioOutlined />}
                        onClick={handleStart}
                        className='h-14 px-10 text-xl font-semibold'
                    >
                        시작
                    </Button>
                ) : (
                    <Button
                        type='primary'
                        size='large'
                        icon={<CheckOutlined />}
                        onClick={handleComplete}
                        className='h-14 px-10 text-xl font-semibold bg-green-500 hover:bg-green-600'
                    >
                        완료
                    </Button>
                )}
            </div>

            {/* 페이지 인디케이터 */}
            <div className='absolute bottom-4 right-6'>
                <div className='bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg'>
                    <div className='text-sm font-medium text-center'>
                        질문 {questionNumber} / {totalQuestions}
                    </div>
                    <div className='text-xs text-blue-100 text-center mt-1'>
                        {Math.round((questionNumber / totalQuestions) * 100)}% 완료
                    </div>
                </div>
            </div>
        </div>
    );
}
