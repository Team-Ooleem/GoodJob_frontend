// result/_components/OverallEvaluationCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { api } from '@/apis/api';
import type { InterviewAnalysisResult } from '@/types/report';

interface OverallEvaluationCardProps {
    sessionId: string;
    compact?: boolean;
}

// API 호출 함수
const getOverallEvaluation = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/overall-evaluation`);
    return response.data;
};

export default function OverallEvaluationCard({
    sessionId,
    compact = false,
}: OverallEvaluationCardProps) {
    // API 호출
    const {
        data: reportData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['overall-evaluation', sessionId],
        queryFn: async () => {
            const response = await getOverallEvaluation(sessionId);
            if (response?.success && response?.data) {
                return response.data;
            }
            throw new Error('종합 평가 데이터를 불러올 수 없습니다.');
        },
        enabled: !!sessionId,
        retry: 1,
    });

    // 로딩 상태
    if (isLoading) {
        return (
            <>
                <Card className='border-0 shadow-lg mb-8'>
                    <CardHeader>
                        <CardTitle>종합 평가</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='animate-pulse'>
                            <div className='h-4 bg-gray-200 rounded mb-2'></div>
                            <div className='h-4 bg-gray-200 rounded mb-2'></div>
                            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                        </div>
                    </CardContent>
                </Card>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                    <Card className='border-0 shadow-lg'>
                        <CardHeader>
                            <CardTitle>강점</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='animate-pulse space-y-3'>
                                <div className='h-4 bg-gray-200 rounded'></div>
                                <div className='h-4 bg-gray-200 rounded'></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='border-0 shadow-lg'>
                        <CardHeader>
                            <CardTitle>개선사항</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='animate-pulse space-y-3'>
                                <div className='h-4 bg-gray-200 rounded'></div>
                                <div className='h-4 bg-gray-200 rounded'></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // 에러 상태
    if (error || !reportData) {
        return (
            <Card className='border-0 shadow-lg mb-8'>
                <CardContent className='pt-6'>
                    <div className='text-red-500'>종합 평가를 불러올 수 없습니다.</div>
                </CardContent>
            </Card>
        );
    }

    const { topReasons, topImprovements } = reportData;
    return (
        <>
            {/* 강점과 개선사항 */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                <Card className='border-0 shadow-lg'>
                    <CardHeader>
                        <CardTitle>주요 강점</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-3'>
                            {topReasons?.length ? (
                                topReasons.map((item: string, index: number) => (
                                    <div key={index} className='flex items-start gap-2'>
                                        <CheckCircle className='text-green-500 w-5 h-5 mt-0.5 flex-shrink-0' />
                                        <span className='text-sm'>{item}</span>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-muted-foreground'>강점 정보 없음</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className='border-0 shadow-lg'>
                    <CardHeader>
                        <CardTitle>주요 개선사항</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-3'>
                            {topImprovements?.length ? (
                                topImprovements.map((item: string, index: number) => (
                                    <div key={index} className='flex items-start gap-2'>
                                        <TrendingUp className='text-orange-500 w-5 h-5 mt-0.5 flex-shrink-0' />
                                        <span className='text-sm'>{item}</span>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-muted-foreground'>
                                    개선사항 정보 없음
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
