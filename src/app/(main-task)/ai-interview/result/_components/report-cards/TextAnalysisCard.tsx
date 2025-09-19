// result/_components/TextAnalysisCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { api } from '@/apis/api';

interface TextAnalysisCardProps {
    sessionId: string;
    userName?: string;
}

// API 호출 함수
const getTextAnalysis = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/text-analysis`);
    return response.data;
};

export default function TextAnalysisCard({
    sessionId,
    userName = '응시자',
}: TextAnalysisCardProps) {
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

    // LLM 종합 점수별 멘트
    const getLLMScoreMessage = (score: number) => {
        if (score >= 9)
            return `${userName}님의 답변이 정말 인상적이에요! 내용도 탄탄하고 맥락도 완벽하게 맞춰서 말씀하셨네요. 이런 준비된 모습이면 어떤 면접에서도 좋은 결과를 얻으실 거예요!`;
        if (score >= 8)
            return `${userName}님, 정말 좋은 답변을 해주셨어요! 대부분의 질문에 대해 구체적이고 적절한 답변을 하셨습니다. 조금만 더 다듬으면 완벽할 것 같아요!`;
        if (score >= 7)
            return `${userName}님의 답변이 기본적으로는 잘 구성되어 있어요. 몇 가지 질문에서 더 구체적인 사례나 맥락을 연결하면 더욱 좋은 평가를 받을 수 있을 거예요!`;
        if (score >= 6)
            return `${userName}님, 면접 연습을 통해 충분히 개선할 수 있는 수준이에요. 질문의 의도를 더 정확히 파악하고 구체적인 경험을 바탕으로 답변해보세요!`;
        return `${userName}님, 처음엔 누구나 어려워요! 지금부터 하나씩 연습하면서 답변 구조와 맥락 파악 능력을 키워가시면 됩니다. 꾸준히 하시면 분명 좋아질 거예요!`;
    };

    // 내용 적합도 설명
    const getContentScoreExplanation = (score: number) => {
        if (score >= 90)
            return `답변이 매우 구체적이고 정확해요! 구체적인 사례와 데이터를 잘 활용해서 설득력 있는 답변을 하셨습니다.`;
        if (score >= 80)
            return `답변이 대체로 구체적이고 논리적이에요. 몇 가지 사례를 더 추가하면 더욱 완성도 높은 답변이 될 것 같아요.`;
        if (score >= 70)
            return `기본적인 답변 구조는 잘 갖추고 있어요. 구체적인 예시와 데이터를 더 활용해보세요.`;
        if (score >= 60)
            return `답변이 조금 추상적인 면이 있어요. 구체적인 경험과 사례를 바탕으로 답변해보세요.`;
        return `답변이 두루뭉술한 면이 있어요. 구체적인 경험과 구체적인 사례를 중심으로 답변을 구성해보세요.`;
    };

    // 맥락 일치도 설명
    const getContextScoreExplanation = (score: number) => {
        if (score >= 90)
            return `질문의 의도와 맥락을 매우 정확히 파악하고 있어요! 면접 상황에 맞는 적절한 톤으로 답변하셨습니다.`;
        if (score >= 80)
            return `질문의 의도를 잘 이해하고 있어요. 상황에 맞는 답변을 하려는 노력이 보입니다.`;
        if (score >= 70)
            return `기본적인 맥락 파악은 하고 있어요. 질문의 핵심을 더 정확히 파악해보세요.`;
        if (score >= 60)
            return `답변이 질문의 맥락과 조금 어긋나는 면이 있어요. 질문의 의도를 더 신중히 파악해보세요.`;
        return `답변이 질문의 맥락과 맞지 않는 부분이 있어요. 질문을 더 자세히 듣고 답변해보세요.`;
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
                <CardTitle>텍스트 분석 요약 &#40;내용·맥락&#41;</CardTitle>
            </CardHeader>
            <CardContent>
                {/* LLM 종합 점수 멘트 */}
                <div className='mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200'>
                    <div className='text-base text-gray-700 leading-relaxed'>
                        {getLLMScoreMessage(textAnalysis?.overall_llm10 || 0)}
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                    <Card>
                        <CardContent className='pt-4 text-center'>
                            <div className='text-xl mb-2'>LLM 종합</div>
                            <div
                                className='text-4xl font-bold'
                                style={{
                                    color: getScoreColor((textAnalysis?.overall_llm10 || 0) * 10),
                                }}
                            >
                                {textAnalysis?.overall_llm10 || 0}
                                <span className='text-base ml-1'>/ 10</span>
                            </div>
                            <div className='text-xs text-gray-500 mt-2'>
                                내용 60% + 맥락 40% 가중평균
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className='pt-4'>
                            <div className='text-xl mb-2'>내용 적합도</div>
                            <Progress value={textAnalysis?.content_avg100 || 0} className='h-3' />
                            <div className='text-sm text-gray-500 mt-2'>
                                {getContentScoreExplanation(textAnalysis?.content_avg100 || 0)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className='pt-4'>
                            <div className='text-xl mb-2'>맥락 일치도</div>
                            <Progress value={textAnalysis?.context_avg100 || 0} className='h-3' />
                            <div className='text-sm text-gray-500 mt-2'>
                                {getContextScoreExplanation(textAnalysis?.context_avg100 || 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator className='my-6' />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                        <div className=' text-dark-400 mb-3 p-2'>
                            AI가 이렇게 판단한 이유를 알려드릴게요
                        </div>
                        <div className='mb-3 font-semibold text-dark-400 flex items-center gap-2'>
                            <CheckCircle className='text-green-500 w-4 h-4' />
                            상위 근거
                        </div>
                        <div className='space-y-2'>
                            {textAnalysis?.top_reasons?.length ? (
                                textAnalysis.top_reasons.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className='flex items-start gap-2 p-2 bg-green-50 rounded border border-green-100'
                                    >
                                        <CheckCircle className='text-green-500 w-4 h-4 flex-shrink-0 mt-0.5' />
                                        <span className='text-sm text-gray-700'>{item}</span>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-muted-foreground p-2 bg-gray-50 rounded'>
                                    근거 정보 없음
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className='text-dark-400 mb-3 p-2'>
                            이렇게 하면 더 좋은 점수를 받을 수 있어요
                        </div>
                        <div className='mb-3 font-semibold text-dark-400 flex items-center gap-2'>
                            <TrendingUp className='text-blue-500 w-4 h-4' />
                            개선 팁
                        </div>
                        <div className='space-y-2'>
                            {textAnalysis?.top_improvements?.length ? (
                                textAnalysis.top_improvements.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className='flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-100'
                                    >
                                        <TrendingUp className='text-blue-500 w-4 h-4 flex-shrink-0 mt-0.5' />
                                        <span className='text-sm text-gray-700'>{item}</span>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-muted-foreground p-2 bg-gray-50 rounded'>
                                    개선 팁 없음
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!!textAnalysis?.evidence_links?.length && (
                    <>
                        <Separator className='my-6' />
                        <div className='mb-3 font-semibold flex items-center gap-2'>
                            <Badge variant='secondary' className='bg-purple-100 text-purple-700'>
                                분석
                            </Badge>
                            근거 하이라이트
                        </div>
                        <div className='text-sm text-gray-600 mb-3 p-2 bg-purple-50 rounded'>
                            답변과 이력서가 얼마나 잘 연결되었는지 보여드릴게요
                        </div>
                        <div className='space-y-3'>
                            {textAnalysis.evidence_links.map((link: any, index: number) => (
                                <div
                                    key={index}
                                    className='p-3 bg-purple-50 rounded-lg border border-purple-100 space-y-2'
                                >
                                    <div className='flex items-center gap-2'>
                                        <Badge
                                            variant='secondary'
                                            className='bg-green-100 text-green-700'
                                        >
                                            답변
                                        </Badge>
                                        <span className='text-sm font-medium text-gray-800'>
                                            {link?.answer_span}
                                        </span>
                                    </div>
                                    {link?.resume_ref && (
                                        <div className='flex items-center gap-2'>
                                            <Badge
                                                variant='outline'
                                                className='border-blue-200 text-blue-700'
                                            >
                                                이력서
                                            </Badge>
                                            <span className='text-sm text-gray-700'>
                                                {link.resume_ref}
                                            </span>
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
