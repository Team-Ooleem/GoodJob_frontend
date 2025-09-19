// result/_components/ExpressionIndicesCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/apis/api';
import type { InterviewAnalysisResult } from '@/types/report';

interface ExpressionIndicesCardProps {
    sessionId: string;
}

// API 호출 함수
const getExpressionIndices = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/expression-indices`);
    return response.data;
};

export default function ExpressionIndicesCard({ sessionId }: ExpressionIndicesCardProps) {
    // API 호출
    const {
        data: reportData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['expression-indices', sessionId],
        queryFn: async () => {
            const response = await getExpressionIndices(sessionId);
            if (response?.success && response?.data?.expressionIndices) {
                return response.data.expressionIndices;
            }
            throw new Error('표현 지수 데이터를 불러올 수 없습니다.');
        },
        enabled: !!sessionId,
        retry: 1,
    });

    // 점수 관련 유틸리티 함수
    const getScoreColor = (score: number) => {
        if (score >= 90) return '#52c41a';
        if (score >= 80) return '#1890ff';
        if (score >= 70) return '#faad14';
        return '#ff4d4f';
    };

    // 로딩 상태
    if (isLoading) {
        return (
            <Card className='border-0 shadow-lg mb-8'>
                <CardHeader>
                    <CardTitle>표현 지수</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className='h-20 bg-gray-200 rounded'></div>
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
                    <div className='text-red-500'>표현 지수를 불러올 수 없습니다.</div>
                </CardContent>
            </Card>
        );
    }

    const expressionIndices = reportData;

    if (!expressionIndices) {
        return null;
    }

    return (
        <Card className='border-0 shadow-lg mb-8'>
            <CardHeader>
                <CardTitle>표현 지수</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    <Card className='text-center'>
                        <CardContent className='pt-4'>
                            <div className='text-gray-600 mb-1'>자신감</div>
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(expressionIndices?.confidence || 0),
                                }}
                            >
                                {expressionIndices?.confidence || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='text-center'>
                        <CardContent className='pt-4'>
                            <div className='text-gray-600 mb-1'>명료성</div>
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(expressionIndices?.clarity || 0),
                                }}
                            >
                                {expressionIndices?.clarity || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='text-center'>
                        <CardContent className='pt-4'>
                            <div className='text-gray-600 mb-1'>몰입도</div>
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(expressionIndices?.engagement || 0),
                                }}
                            >
                                {expressionIndices?.engagement || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='text-center'>
                        <CardContent className='pt-4'>
                            <div className='text-gray-600 mb-1'>침착성</div>
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(expressionIndices?.composure || 0),
                                }}
                            >
                                {expressionIndices?.composure || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='text-center'>
                        <CardContent className='pt-4'>
                            <div className='text-gray-600 mb-1'>전문성</div>
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(expressionIndices?.professionalism || 0),
                                }}
                            >
                                {expressionIndices?.professionalism || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='text-center'>
                        <CardContent className='pt-4'>
                            <div className='text-gray-600 mb-1'>일관성</div>
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(expressionIndices?.consistency || 0),
                                }}
                            >
                                {expressionIndices?.consistency || 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {typeof expressionIndices?.reliabilityWeight === 'number' && (
                    <div className='mt-3 text-right text-xs text-gray-500'>
                        신뢰도 가중치: {expressionIndices?.reliabilityWeight}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
