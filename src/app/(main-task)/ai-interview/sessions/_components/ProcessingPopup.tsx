'use client';

import { useState, useEffect } from 'react';

export type ProcessingStep =
    | 'webcam-upload'
    | 'audio-analysis'
    | 'stt-transcription'
    | 'content-analysis'
    | 'next-question';

interface ProcessingPopupProps {
    isVisible: boolean;
    currentStep: ProcessingStep | null;
    onComplete?: () => void;
}

const STEP_MESSAGES: Record<ProcessingStep, string> = {
    'webcam-upload': '영상 데이터를 업로드하고 있습니다...',
    'audio-analysis': '음성을 분석하고 있습니다...',
    'stt-transcription': '답변 내용을 텍스트화하고 있습니다...',
    'content-analysis': '답변 내용을 분석하고 있습니다...',
    'next-question': '다음 질문을 생성하고 있습니다...',
};

const STEP_ORDER: ProcessingStep[] = [
    'webcam-upload',
    'audio-analysis',
    'stt-transcription',
    'content-analysis',
    'next-question',
];

export default function ProcessingPopup({
    isVisible,
    currentStep,
    onComplete,
}: ProcessingPopupProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!isVisible) {
            setIsAnimating(false);
            return;
        }

        setIsAnimating(true);
    }, [isVisible]);

    // finalizing 단계는 제거되었으므로 이 useEffect는 더 이상 필요하지 않음

    if (!isVisible) return null;

    const currentStepIndex = currentStep ? STEP_ORDER.indexOf(currentStep) : 0;
    const progress = currentStep ? ((currentStepIndex + 1) / STEP_ORDER.length) * 100 : 0;
    const currentMessage = currentStep ? STEP_MESSAGES[currentStep] : '처리 중입니다...';

    return (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[4000]'>
            <div className='bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform transition-all duration-300 scale-100'>
                <div className='text-center'>
                    {/* 로딩 스피너 */}
                    <div className='w-16 h-16 mx-auto mb-6 relative'>
                        <div className='w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600'></div>
                        <div className='absolute inset-0 flex items-center justify-center'>
                            <div className='w-6 h-6 bg-blue-600 rounded-full animate-pulse'></div>
                        </div>
                    </div>

                    {/* 현재 단계 텍스트 */}
                    <div className='min-h-[60px] flex items-center justify-center'>
                        <p className='text-lg font-medium text-gray-800 transition-all duration-300'>
                            {currentMessage}
                        </p>
                    </div>

                    {/* 진행률 바 */}
                    <div className='w-full bg-gray-200 rounded-full h-2 mb-4'>
                        <div
                            className='bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out'
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* 단계 표시 */}
                    <div className='flex justify-center space-x-2'>
                        {STEP_ORDER.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>

                    {/* 진행률 퍼센트 */}
                    <p className='text-sm text-gray-500 mt-2'>{Math.round(progress)}% 완료</p>
                </div>
            </div>
        </div>
    );
}
