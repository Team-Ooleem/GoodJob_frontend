// result/_components/QuestionFeedbackCard.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/apis/api';

interface QAPair {
    question: string;
    answer: string;
}

interface QuestionFeedbackCardProps {
    sessionId: string;
    qaList: QAPair[];
    showDetailedFeedback?: boolean;
    compact?: boolean;
}

// API 호출 함수
const getQuestionFeedback = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/question-feedback`);
    console.log(response);
    return response.data;
};

export default function QuestionFeedbackCard({
    sessionId,
    qaList,
    showDetailedFeedback = true,
    compact = false,
}: QuestionFeedbackCardProps) {
    const [showFullFeedback, setShowFullFeedback] = useState(!compact);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

    // 질문 토글 함수
    const toggleQuestion = (index: number) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedQuestions(newExpanded);
    };

    // API 호출
    const {
        data: reportData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['question-feedback', sessionId],
        queryFn: async () => {
            const response = await getQuestionFeedback(sessionId);
            if (response?.success && response?.data) {
                return response.data;
            }
            throw new Error('질문 피드백 데이터를 불러올 수 없습니다.');
        },
        enabled: !!sessionId,
        retry: 1,
    });

    // 로딩 상태
    if (isLoading) {
        return (
            <Card className='border-0 shadow-lg mb-8'>
                <CardHeader>
                    <CardTitle>질문별 상세 피드백</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='animate-pulse space-y-4'>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className='h-32 bg-gray-200 rounded'></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // 에러 상태
    if (error || !reportData) {
        return (
            <Card className='border-0 shadow-lg mb-8'>
                <CardContent className='pt-6'>
                    <div className='text-red-500'>질문 피드백을 불러올 수 없습니다.</div>
                </CardContent>
            </Card>
        );
    }

    const questionFeedback = reportData.questionFeedback || [];

    // 유사도 점수 관련 유틸리티 함수
    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 0.7) return '#52c41a';
        if (similarity >= 0.5) return '#1890ff';
        if (similarity >= 0.3) return '#faad14';
        return '#ff4d4f';
    };

    const getSimilarityLevel = (similarity: number) => {
        if (similarity >= 0.7) return '높음';
        if (similarity >= 0.5) return '보통';
        if (similarity >= 0.3) return '낮음';
        return '매우 낮음';
    };

    if (!showDetailedFeedback) {
        return null;
    }

    return (
        <Card className='border-0 shadow-lg mb-8'>
            <CardHeader>
                <div className='flex justify-between items-center'>
                    <CardTitle>질문별 상세 피드백</CardTitle>
                    {compact && (
                        <Button size='sm' onClick={() => setShowFullFeedback(!showFullFeedback)}>
                            {showFullFeedback ? '접기' : '펼치기'}
                        </Button>
                    )}
                </div>
            </CardHeader>
            {(!compact || showFullFeedback) && (
                <CardContent>
                    <div className='space-y-4'>
                        {questionFeedback.map((feedback: any, index: number) => {
                            const isExpanded = expandedQuestions.has(index);
                            return (
                                <div
                                    key={index}
                                    className='border border-gray-200 rounded-lg overflow-hidden'
                                >
                                    {/* 질문 헤더 - 클릭 가능 */}
                                    <div
                                        className='flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors'
                                        onClick={() => toggleQuestion(index)}
                                    >
                                        <div className='flex items-center space-x-3'>
                                            {isExpanded ? (
                                                <ChevronDown className='h-4 w-4 text-gray-500' />
                                            ) : (
                                                <ChevronRight className='h-4 w-4 text-gray-500' />
                                            )}
                                            <div className='font-semibold text-lg'>
                                                Q{index + 1}. 질문 피드백
                                            </div>
                                        </div>
                                        <Badge
                                            variant='secondary'
                                            className='text-sm'
                                            style={{
                                                backgroundColor: getSimilarityColor(
                                                    feedback.similarity,
                                                ),
                                                color: 'white',
                                            }}
                                        >
                                            유사도: {Math.round(feedback.similarity * 100)}% (
                                            {getSimilarityLevel(feedback.similarity)})
                                        </Badge>
                                    </div>

                                    {/* 답변과 피드백 내용 - 펼쳐질 때만 표시 */}
                                    {isExpanded && (
                                        <div className='border-t border-gray-200 p-4 space-y-4'>
                                            <div className='bg-gray-50 p-4 rounded-lg'>
                                                <p className='text-sm text-gray-600'>
                                                    <strong>답변:</strong> {feedback.answer_span}
                                                </p>
                                            </div>

                                            <div className='bg-blue-50 p-4 rounded-lg'>
                                                <p className='text-sm'>
                                                    <strong>AI 피드백:</strong>{' '}
                                                    {feedback.explanation}
                                                </p>
                                            </div>

                                            {feedback.resume_ref && (
                                                <div className='bg-green-50 p-4 rounded-lg'>
                                                    <p className='text-sm'>
                                                        <strong>이력서 참조:</strong>{' '}
                                                        {feedback.resume_ref}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
