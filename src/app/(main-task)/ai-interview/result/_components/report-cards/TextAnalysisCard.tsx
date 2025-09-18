// result/_components/TextAnalysisCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { api } from '@/apis/api';
import type { InterviewAnalysisResult } from '@/types/report';

interface TextAnalysisCardProps {
    sessionId: string;
}

// API 호출 함수
const getTextAnalysis = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/text-analysis`);
    return response.data;
};

export default function TextAnalysisCard({ sessionId }: TextAnalysisCardProps) {
    // API 호출
    const {
        data: reportData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['text-analysis', sessionId],
        queryFn: async () => {
            const response = await getTextAnalysis(sessionId);
            if (response?.success && response?.data) {
                return response.data;
            }
            throw new Error('텍스트 분석 데이터를 불러올 수 없습니다.');
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

    // 숫자 포맷 보조
    const fmt = (n: any, digits: number = 3) => {
        if (n == null || Number.isNaN(Number(n))) return '-';
        const num = Number(n);
        if (!Number.isFinite(num)) return '-';
        return Number(num.toFixed(digits));
    };

    // 로딩 상태
    if (isLoading) {
        return (
            <Card className='border-0 shadow-lg mb-8'>
                <CardHeader>
                    <CardTitle>텍스트 분석 요약</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='animate-pulse space-y-4'>
                        <div className='h-4 bg-gray-200 rounded'></div>
                        <div className='h-4 bg-gray-200 rounded'></div>
                        <div className='h-4 bg-gray-200 rounded w-3/4'></div>
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
                    <div className='text-red-500'>텍스트 분석을 불러올 수 없습니다.</div>
                </CardContent>
            </Card>
        );
    }

    const textAnalysis = reportData?.textAnalysis;

    if (!textAnalysis) {
        return null;
    }

    return (
        <Card className='border-0 shadow-lg mb-8'>
            <CardHeader>
                <CardTitle>텍스트 분석 요약(내용·맥락)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                    <Card>
                        <CardContent className='pt-4 text-center'>
                            <div className='mb-2'>LLM 종합</div>
                            <div
                                className='text-4xl font-bold'
                                style={{
                                    color: getScoreColor((textAnalysis?.overall_llm10 || 0) * 10),
                                }}
                            >
                                {textAnalysis?.overall_llm10 || 0}
                                <span className='text-base ml-1'>/ 10</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className='pt-4'>
                            <div className='mb-2'>내용 적합도</div>
                            <Progress value={textAnalysis?.content_avg100 || 0} className='h-3' />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className='pt-4'>
                            <div className='mb-2'>맥락 일치도</div>
                            <Progress value={textAnalysis?.context_avg100 || 0} className='h-3' />
                        </CardContent>
                    </Card>
                </div>

                <Separator className='my-6' />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                        <div className='mb-3 font-semibold'>상위 근거</div>
                        <div className='space-y-2'>
                            {textAnalysis?.top_reasons?.length ? (
                                textAnalysis.top_reasons.map((item: any, index: number) => (
                                    <div key={index} className='flex items-center gap-2'>
                                        <CheckCircle className='text-green-500 w-4 h-4 flex-shrink-0' />
                                        <span className='text-sm'>{item}</span>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-muted-foreground'>근거 정보 없음</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className='mb-3 font-semibold'>개선 팁</div>
                        <div className='space-y-2'>
                            {textAnalysis?.top_improvements?.length ? (
                                textAnalysis.top_improvements.map((item: any, index: number) => (
                                    <div key={index} className='flex items-center gap-2'>
                                        <TrendingUp className='text-blue-500 w-4 h-4 flex-shrink-0' />
                                        <span className='text-sm'>{item}</span>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-muted-foreground'>개선 팁 없음</div>
                            )}
                        </div>
                    </div>
                </div>

                {!!textAnalysis?.evidence_links?.length && (
                    <>
                        <Separator className='my-6' />
                        <div className='mb-3 font-semibold'>근거 하이라이트</div>
                        <div className='space-y-3'>
                            {textAnalysis.evidence_links.map((link: any, index: number) => (
                                <div key={index} className='space-y-2'>
                                    <div className='flex items-center gap-2'>
                                        <Badge variant='secondary'>답변</Badge>
                                        <span className='text-sm'>{link?.answer_span}</span>
                                    </div>
                                    {link?.resume_ref && (
                                        <div className='flex items-center gap-2'>
                                            <Badge variant='outline'>이력서</Badge>
                                            <span className='text-sm'>{link.resume_ref}</span>
                                        </div>
                                    )}
                                    <div className='text-xs text-gray-500'>
                                        유사도: {fmt(link?.similarity ?? '-', 3)}
                                        {link?.explanation ? ` · ${link.explanation}` : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
