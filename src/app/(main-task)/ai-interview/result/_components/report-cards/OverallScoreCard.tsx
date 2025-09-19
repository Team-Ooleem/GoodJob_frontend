// result/_components/OverallScoreCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
    Trophy,
    Star,
    CheckCircle,
    MessageCircle,
    Target,
    Zap,
    Shield,
    Briefcase,
    BarChart3,
    Info,
} from 'lucide-react';
import { api } from '@/apis/api';
import type { InterviewAnalysisResult } from '@/types/report';

interface OverallScoreCardProps {
    analysisResult: InterviewAnalysisResult;
    compact?: boolean;
    userName?: string;
    sessionId?: string;
}

// API 호출 함수들
const getDetailedScores = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/detailed-scores`);
    return response.data;
};

const getExpressionIndices = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/expression-indices`);
    return response.data;
};

export default function OverallScoreCard({
    analysisResult,
    compact = false,
    userName = '응시자',
    sessionId,
}: OverallScoreCardProps) {
    // 세부 점수 데이터 쿼리
    const { data: detailedScores, isLoading: isDetailedLoading } = useQuery({
        queryKey: ['detailed-scores', sessionId],
        queryFn: async () => {
            if (!sessionId) return null;
            const response = await getDetailedScores(sessionId);
            if (response?.success && response?.data?.detailedScores) {
                return response.data.detailedScores;
            }
            return null;
        },
        enabled: !!sessionId,
        retry: 1,
    });

    // 표현 지수 데이터 쿼리
    const { data: expressionIndices, isLoading: isExpressionLoading } = useQuery({
        queryKey: ['expression-indices', sessionId],
        queryFn: async () => {
            if (!sessionId) return null;
            const response = await getExpressionIndices(sessionId);
            if (response?.success && response?.data?.expressionIndices) {
                return response.data.expressionIndices;
            }
            return null;
        },
        enabled: !!sessionId,
        retry: 1,
    });

    // 점수 관련 유틸리티 함수들
    const getScoreColor = (score: number) => {
        if (score >= 90) return '#52c41a';
        if (score >= 80) return '#1890ff';
        if (score >= 70) return '#faad14';
        return '#ff4d4f';
    };

    // 세부 점수 기반 구체적인 피드백 생성 (사람인 스타일)
    const getDetailedFeedback = (score: number) => {
        const scoreRange = Math.floor(score / 10) * 10;

        const contentScore = detailedScores?.content30 || 0;
        const contextScore = detailedScores?.context30 || 0;
        const expressionScore = detailedScores?.expression40 || 0;

        const indices = [
            { name: '자신감', score: expressionIndices?.confidence || 0, max: 8 },
            { name: '명료성', score: expressionIndices?.clarity || 0, max: 8 },
            { name: '몰입도', score: expressionIndices?.engagement || 0, max: 8 },
            { name: '침착성', score: expressionIndices?.composure || 0, max: 6 },
            { name: '전문성', score: expressionIndices?.professionalism || 0, max: 6 },
            { name: '일관성', score: expressionIndices?.consistency || 0, max: 4 },
        ];

        const strongIndices = indices.filter((idx) => idx.score / idx.max >= 0.8);
        const weakIndices = indices.filter((idx) => idx.score / idx.max < 0.6);

        const contentPct = (contentScore / 30) * 100;
        const contextPct = (contextScore / 30) * 100;
        const expressionPct = (expressionScore / 40) * 100;

        let feedback = '';

        if (scoreRange >= 90) {
            feedback = `${userName}님, 정말 인상 깊은 면접이었습니다.`;
            if (contentPct >= 90)
                feedback += `답변 하나하나가 질문의 핵심을 정확히 짚고 있어서, 면접관 입장에서 매우 신뢰가 갔습니다. `;
            if (contextPct >= 90)
                feedback += `상황에 대한 이해도와 문맥 파악도 훌륭해서, 답변 흐름이 매우 자연스러웠어요. `;
            if (expressionPct >= 90)
                feedback += `표현력 또한 뛰어나서, 말투와 표정에서 자신감과 안정감이 느껴졌습니다. `;
            feedback += `이런 준비와 태도라면 어떤 면접에서도 좋은 결과를 기대하셔도 좋습니다!`;
        } else if (scoreRange >= 80) {
            feedback = `${userName}님, 좋은 인상을 남긴 면접이었습니다.`;
            if (contentPct >= 80)
                feedback += `답변의 내용이 구체적이고 논리적이어서, 신중하게 준비한 흔적이 보였습니다. `;
            if (contextPct >= 80)
                feedback += `질문의 의도를 빠르게 파악하고, 알맞은 사례로 연결하는 능력이 돋보였어요. `;
            if (strongIndices.length > 0)
                feedback += `특히 ${strongIndices.map((idx) => idx.name).join(', ')} 부분에서는 매우 좋은 평가를 받았습니다. `;
            if (weakIndices.length > 0)
                feedback += `다만 ${weakIndices.map((idx) => idx.name).join(', ')} 측면에서는 조금 더 다듬는다면, 훨씬 안정적인 인상을 줄 수 있을 거예요.`;
        } else if (scoreRange >= 70) {
            feedback = `${userName}님, 기본적인 면접 역량을 잘 보여주셨습니다.`;
            if (contentPct >= 70)
                feedback += `전체적인 답변 구조가 안정적이었고, 핵심을 놓치지 않으려는 노력이 느껴졌습니다. `;
            if (contextPct >= 70) feedback += `질문 맥락에 대한 이해도도 나쁘지 않았습니다. `;
            if (strongIndices.length > 0)
                feedback += `${strongIndices.map((idx) => idx.name).join(', ')} 측면에서는 강점을 보여주셨어요. `;
            if (weakIndices.length > 0)
                feedback += `한편 ${weakIndices.map((idx) => idx.name).join(', ')} 부분은 약간의 연습이 더해진다면, 더욱 자연스러운 답변이 가능할 것 같아요. `;
            feedback += `조금만 더 디테일을 다듬으면, 충분히 더 좋은 결과를 기대하실 수 있습니다.`;
        } else if (scoreRange >= 60) {
            feedback = `${userName}님, 가능성이 많은 면접이었습니다.`;
            if (contentPct >= 60) feedback += `기본적인 답변 틀은 잘 갖추고 있으셨습니다. `;
            if (contextPct >= 60)
                feedback += `다만 맥락을 연결하는 부분에서 아쉬움이 있었고, 면접의 흐름이 약간 끊긴 느낌이 있었어요. `;
            if (weakIndices.length > 0)
                feedback += `${weakIndices.map((idx) => idx.name).join(', ')} 부분에서 조금 더 자신감 있게 임하신다면 큰 차이를 만들 수 있을 거예요. `;
            feedback += `면접 연습을 조금만 더 해보시면 훨씬 자연스러운 표현과 구조가 가능하실 겁니다.`;
        } else if (scoreRange >= 50) {
            feedback = `${userName}님, 이번 면접은 앞으로를 위한 좋은 시작이었습니다.`;
            if (contentPct < 60)
                feedback += `답변이 조금 두루뭉술하거나 구체성이 부족한 부분이 있었습니다. `;
            if (contextPct < 60)
                feedback += `질문의 의도나 맥락을 파악하는 데 시간이 걸렸던 것 같아요. `;
            if (weakIndices.length > 0)
                feedback += `${weakIndices.map((idx) => idx.name).join(', ')} 부분은 특히 의식적으로 연습해보시면 도움이 될 것 같습니다. `;
            feedback += `이번 경험을 바탕으로 방향을 잡아가시면, 다음 면접은 훨씬 수월하게 느껴지실 거예요.`;
        } else {
            feedback = `${userName}님, 누구에게나 처음은 있습니다.`;
            feedback += `아직은 면접에 대한 감이 잡히지 않은 듯하지만, 지금부터 하나씩 배워가시면 됩니다. `;
            feedback += `답변 구성, 상황 이해, 비언어적 표현 등 기초적인 부분부터 차근차근 정리해보세요. `;
            feedback += `성장 속도는 사람마다 다르지만, 꾸준히 연습하면 분명히 좋아질 수 있습니다. 응원할게요!`;
        }

        const percentile = Math.max(10, Math.min(95, 100 - scoreRange + 10));
        const strength =
            scoreRange >= 80
                ? '우수한 응시자'
                : scoreRange >= 70
                  ? '기본기가 탄탄한 응시자'
                  : scoreRange >= 60
                    ? '가능성이 보이는 응시자'
                    : '면접 역량을 키워가는 중인 응시자';

        return {
            strength,
            message: feedback,
            percentile,
        };
    };

    const feedback = getDetailedFeedback(analysisResult.overall_score);
    const isLoading = isDetailedLoading || isExpressionLoading;

    return (
        <div className='space-y-8 mb-8'>
            {/* 헤더 섹션 (이미지 스타일) */}
            <div className='text-start mb-8'>
                <div className='text-sm text-gray-500 mb-2 flex items-center justify-start gap-1'>
                    <span>
                        AI 모의면접 결과 &#40;응시 {new Date().toLocaleString('ko-KR')} | 이력서
                        기반&#41;
                    </span>
                    <Info className='w-3 h-3' />
                </div>
                <div className='text-5xl font-bold text-gray-800'>
                    {userName}님은 {feedback?.strength}입니다.
                </div>
            </div>

            {/* 전체 점수 카드 (사람인 스타일) */}
            <Card className='border-0 mb-0 shadow-lg bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white rounded-bl-none rounded-br-none'>
                <CardContent className='p-8'>
                    <div className='flex items-start justify-between mb-6'>
                        <div>
                            <h2 className='text-2xl font-bold mb-2'>총평</h2>
                            <div className='text-sm text-slate-300'>
                                * 총평의 점수는 응답 신뢰도와 영상 분석이 합산된 점수입니다.
                            </div>
                        </div>
                    </div>

                    <div className='flex items-center gap-8'>
                        {/* 원형 점수 표시 */}
                        <div className='relative'>
                            <div className='w-32 h-32 rounded-full border-8 border-slate-400 flex items-center justify-center'>
                                <div className='text-center'>
                                    <div
                                        className='text-4xl font-bold'
                                        style={{
                                            color: getScoreColor(analysisResult?.overall_score),
                                        }}
                                    >
                                        {analysisResult?.overall_score}점
                                    </div>
                                </div>
                            </div>
                            {/* 진행률 표시 */}
                            <div
                                className='absolute top-0 left-0 w-32 h-32 rounded-full border-8 border-transparent'
                                style={{
                                    borderTopColor: getScoreColor(analysisResult?.overall_score),
                                    transform: `rotate(${(analysisResult?.overall_score / 100) * 360 - 90}deg)`,
                                    transition: 'transform 0.5s ease',
                                }}
                            />
                        </div>

                        {/* 상세 피드백 */}
                        <div className='flex-1'>
                            <div className='text-lg leading-relaxed text-slate-200'>
                                {feedback.message}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 면접 영역별 분석 (이미지 레이아웃 스타일) */}
            {!isLoading && detailedScores && (
                <div className='space-y-6 p-8 mb-0 bg-slate-200'>
                    <h3 className='text-xl font-bold text-gray-800 text-center'>
                        면접 영역별 분석
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        {/* 내용 점수 카드 */}
                        <Card className='border-0 shadow-lg bg-white'>
                            <CardContent className='p-6'>
                                <h4 className='text-lg font-semibold text-gray-800 mb-8 text-center'>
                                    내용 점수
                                </h4>

                                {/* 비교 그래프 */}
                                <div className='mb-4'>
                                    <div className='flex items-end justify-center gap-4 h-24'>
                                        <div className='flex flex-col items-center'>
                                            <div className='text-xs text-gray-500 mb-1'>
                                                최대 (30)
                                            </div>
                                            <div
                                                className='w-8 bg-gray-300 rounded-t'
                                                style={{ height: '80px' }}
                                            ></div>
                                            <div className='text-sm font-semibold text-gray-600 mt-1'>
                                                30
                                            </div>
                                        </div>
                                        <div className='flex flex-col items-center'>
                                            <div className='text-xs text-gray-500 mb-1'>
                                                내용점수
                                            </div>
                                            <div
                                                className='w-8 bg-blue-500 rounded-t'
                                                style={{
                                                    height: `${(detailedScores?.content30 / 30) * 80}px`,
                                                }}
                                            ></div>
                                            <div className='text-sm font-semibold text-blue-600 mt-1'>
                                                {detailedScores?.content30}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 상세 설명 */}
                                <div className='text-sm text-gray-600 leading-relaxed'>
                                    <p className='mb-2'>
                                        <strong>답변의 구체성과 정확성</strong>
                                    </p>
                                    <p className='text-xs'>
                                        질문에 대한 답변이 얼마나 구체적이고 정확한지 평가합니다.
                                        추상적인 답변보다는 구체적인 사례와 데이터를 제시하는 능력을
                                        측정합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 맥락 점수 카드 */}
                        <Card className='border-0 shadow-lg bg-white'>
                            <CardContent className='p-6'>
                                <h4 className='text-lg font-semibold text-gray-800 mb-8 text-center'>
                                    맥락 점수
                                </h4>

                                {/* 비교 그래프 */}
                                <div className='mb-4'>
                                    <div className='flex items-end justify-center gap-4 h-24'>
                                        <div className='flex flex-col items-center'>
                                            <div className='text-xs text-gray-500 mb-1'>
                                                최대 (30)
                                            </div>
                                            <div
                                                className='w-8 bg-gray-300 rounded-t'
                                                style={{ height: '80px' }}
                                            ></div>
                                            <div className='text-sm font-semibold text-gray-600 mt-1'>
                                                30
                                            </div>
                                        </div>
                                        <div className='flex flex-col items-center'>
                                            <div className='text-xs text-gray-500 mb-1'>
                                                맥락점수
                                            </div>
                                            <div
                                                className='w-8 bg-indigo-500 rounded-t'
                                                style={{
                                                    height: `${(detailedScores?.context30 / 30) * 80}px`,
                                                }}
                                            ></div>
                                            <div className='text-sm font-semibold text-indigo-600 mt-1'>
                                                {detailedScores?.context30}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 상세 설명 */}
                                <div className='text-sm text-gray-600 leading-relaxed'>
                                    <p className='mb-2'>
                                        <strong>상황에 맞는 적절한 이해도</strong>
                                    </p>
                                    <p className='text-xs'>
                                        질문의 의도와 맥락을 얼마나 정확히 파악하고 있는지
                                        평가합니다. 면접 상황에 맞는 적절한 톤과 내용으로 답변하는
                                        능력을 측정합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 표현 점수 카드 */}
                        <Card className='border-0 shadow-lg bg-white'>
                            <CardContent className='p-6'>
                                <h4 className='text-lg font-semibold text-gray-800 mb-8 text-center'>
                                    표현 점수
                                </h4>

                                {/* 비교 그래프 */}
                                <div className='mb-4'>
                                    <div className='flex items-end justify-center gap-4 h-24'>
                                        <div className='flex flex-col items-center'>
                                            <div className='text-xs text-gray-500 mb-1'>
                                                최대 (40)
                                            </div>
                                            <div
                                                className='w-8 bg-gray-300 rounded-t'
                                                style={{ height: '80px' }}
                                            ></div>
                                            <div className='text-sm font-semibold text-gray-600 mt-1'>
                                                40
                                            </div>
                                        </div>
                                        <div className='flex flex-col items-center'>
                                            <div className='text-xs text-gray-500 mb-1'>
                                                표현점수
                                            </div>
                                            <div
                                                className='w-8 bg-cyan-500 rounded-t'
                                                style={{
                                                    height: `${(detailedScores?.expression40 / 40) * 80}px`,
                                                }}
                                            ></div>
                                            <div className='text-sm font-semibold text-cyan-600 mt-1'>
                                                {detailedScores?.expression40}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 상세 설명 */}
                                <div className='text-sm text-gray-600 leading-relaxed'>
                                    <p className='mb-2'>
                                        <strong>비언어적 소통과 전달력</strong>
                                    </p>
                                    <p className='text-xs'>
                                        목소리 톤, 표정, 제스처 등 비언어적 요소를 통한 전달력을
                                        평가합니다. 자신감 있고 명확한 발음과 적절한 시선처리 능력을
                                        측정합니다.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* 표현 지수 카드 (사람인 스타일) */}
            {/* {!isLoading && expressionIndices && (
                <Card className='border-0 shadow-lg bg-white'>
                    <CardContent className='p-6'>
                        <h3 className='text-xl font-bold text-gray-800 mb-6'>표현력 세부 분석</h3>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            <div className='p-4 bg-blue-50 rounded-lg border border-blue-100'>
                                <div className='flex items-center mb-2'>
                                    <Target className='text-blue-600 w-5 h-5 mr-2' />
                                    <span className='font-semibold text-gray-800'>자신감</span>
                                </div>
                                <div className='text-2xl font-bold text-blue-600 mb-1'>
                                    {expressionIndices?.confidence || 0}
                                </div>
                                <div className='text-xs text-gray-600'>시각적/청각적 자신감</div>
                            </div>
                            <div className='p-4 bg-indigo-50 rounded-lg border border-indigo-100'>
                                <div className='flex items-center mb-2'>
                                    <Zap className='text-indigo-600 w-5 h-5 mr-2' />
                                    <span className='font-semibold text-gray-800'>명료성</span>
                                </div>
                                <div className='text-2xl font-bold text-indigo-600 mb-1'>
                                    {expressionIndices?.clarity || 0}
                                </div>
                                <div className='text-xs text-gray-600'>말의 명확성과 이해도</div>
                            </div>
                            <div className='p-4 bg-cyan-50 rounded-lg border border-cyan-100'>
                                <div className='flex items-center mb-2'>
                                    <Star className='text-cyan-600 w-5 h-5 mr-2' />
                                    <span className='font-semibold text-gray-800'>몰입도</span>
                                </div>
                                <div className='text-2xl font-bold text-cyan-600 mb-1'>
                                    {expressionIndices?.engagement || 0}
                                </div>
                                <div className='text-xs text-gray-600'>면접관과의 상호작용</div>
                            </div>
                            <div className='p-4 bg-sky-50 rounded-lg border border-sky-100'>
                                <div className='flex items-center mb-2'>
                                    <Shield className='text-sky-600 w-5 h-5 mr-2' />
                                    <span className='font-semibold text-gray-800'>침착성</span>
                                </div>
                                <div className='text-2xl font-bold text-sky-600 mb-1'>
                                    {expressionIndices?.composure || 0}
                                </div>
                                <div className='text-xs text-gray-600'>안정성과 침착함</div>
                            </div>
                            <div className='p-4 bg-teal-50 rounded-lg border border-teal-100'>
                                <div className='flex items-center mb-2'>
                                    <Briefcase className='text-teal-600 w-5 h-5 mr-2' />
                                    <span className='font-semibold text-gray-800'>전문성</span>
                                </div>
                                <div className='text-2xl font-bold text-teal-600 mb-1'>
                                    {expressionIndices?.professionalism || 0}
                                </div>
                                <div className='text-xs text-gray-600'>비즈니스 매너</div>
                            </div>
                            <div className='p-4 bg-violet-50 rounded-lg border border-violet-100'>
                                <div className='flex items-center mb-2'>
                                    <BarChart3 className='text-violet-600 w-5 h-5 mr-2' />
                                    <span className='font-semibold text-gray-800'>일관성</span>
                                </div>
                                <div className='text-2xl font-bold text-violet-600 mb-1'>
                                    {expressionIndices?.consistency || 0}
                                </div>
                                <div className='text-xs text-gray-600'>성능의 일관성</div>
                            </div>
                        </div>
                        {typeof expressionIndices?.reliabilityWeight === 'number' && (
                            <div className='mt-4 text-right text-xs text-gray-500'>
                                신뢰도 가중치: {expressionIndices?.reliabilityWeight}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )} */}

            {/* 로딩 상태 */}
            {isLoading && (
                <Card className='border-0 shadow-lg'>
                    <CardContent className='pt-6'>
                        <div className='animate-pulse text-center'>
                            <div className='h-4 bg-gray-200 rounded mb-2 w-32 mx-auto'></div>
                            <div className='h-8 bg-gray-200 rounded w-24 mx-auto'></div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
