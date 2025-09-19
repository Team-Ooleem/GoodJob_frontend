// result/_components/AudioVisualAnalysisCard.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/apis/api';
import Image from 'next/image';

interface AudioVisualAnalysisCardProps {
    sessionId: string;
    showAudioAnalysis?: boolean;
    showVisualAnalysis?: boolean;
}

// API 호출 함수들
const getAudioMetrics = async (sessionId: string) => {
    const response = await api.get(`/audio-metrics/${sessionId}`);
    return response.data;
};

const getVisualMetrics = async (sessionId: string) => {
    const response = await api.post(`/metrics/${sessionId}/finalize`, {});
    return response.data;
};

export default function AudioVisualAnalysisCard({
    sessionId,
    showAudioAnalysis = true,
    showVisualAnalysis = true,
}: AudioVisualAnalysisCardProps) {
    const [showAudioDetails, setShowAudioDetails] = useState(false);
    const [showVisualDetails, setShowVisualDetails] = useState(false);

    // 오디오 메트릭스 쿼리
    const {
        data: audioData,
        isLoading: isAudioLoading,
        error: audioError,
    } = useQuery({
        queryKey: ['audio-visual-audio', sessionId],
        queryFn: async () => {
            const response = await getAudioMetrics(sessionId);
            if (response?.ok && response?.rows) {
                // rows 데이터를 overall 형태로 변환
                const rows = response.rows;
                const overall = {
                    f0_mean:
                        rows.reduce((sum: number, row: any) => sum + (row.f0_mean || 0), 0) /
                        rows.length,
                    f0_std:
                        rows.reduce((sum: number, row: any) => sum + (row.f0_std || 0), 0) /
                        rows.length,
                    f0_cv:
                        rows.reduce((sum: number, row: any) => sum + (row.f0_cv || 0), 0) /
                        rows.length,
                    rms_cv:
                        rows.reduce((sum: number, row: any) => sum + (row.rms_cv || 0), 0) /
                        rows.length,
                    jitter_like:
                        rows.reduce((sum: number, row: any) => sum + (row.jitter_like || 0), 0) /
                        rows.length,
                    shimmer_like:
                        rows.reduce((sum: number, row: any) => sum + (row.shimmer_like || 0), 0) /
                        rows.length,
                    silence_ratio:
                        rows.reduce((sum: number, row: any) => sum + (row.silence_ratio || 0), 0) /
                        rows.length,
                    tone_score:
                        rows.reduce((sum: number, row: any) => sum + (row.tone_score || 0), 0) /
                        rows.length,
                    vibrato_score:
                        rows.reduce((sum: number, row: any) => sum + (row.vibrato_score || 0), 0) /
                        rows.length,
                    pace_score:
                        rows.reduce((sum: number, row: any) => sum + (row.pace_score || 0), 0) /
                        rows.length,
                    overall_voice_score:
                        rows.reduce(
                            (sum: number, row: any) => sum + (row.overall_voice_score || 0),
                            0,
                        ) / rows.length,
                };
                return { overall, perQuestion: rows };
            }
            throw new Error('오디오 메트릭스 데이터를 불러올 수 없습니다.');
        },
        enabled: !!sessionId && showAudioAnalysis,
        retry: 1,
    });

    // 비주얼 메트릭스 쿼리
    const {
        data: visualData,
        isLoading: isVisualLoading,
        error: visualError,
    } = useQuery({
        queryKey: ['audio-visual-visual', sessionId],
        queryFn: async () => {
            const response = await getVisualMetrics(sessionId);
            if (response?.ok && response?.aggregate) {
                return {
                    overall: response.aggregate.overall,
                    perQuestion: response.aggregate.perQuestion,
                };
            }
            throw new Error('비주얼 메트릭스 데이터를 불러올 수 없습니다.');
        },
        enabled: !!sessionId && showVisualAnalysis,
        retry: 1,
    });

    const isLoading = isAudioLoading || isVisualLoading;
    const hasError = audioError || visualError;

    // 점수 관련 유틸리티 함수들
    const getScoreLevel = (score: number) => {
        if (score >= 90) return '우수';
        if (score >= 80) return '양호';
        if (score >= 70) return '보통';
        return '개선 필요';
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-blue-600';
        return 'text-orange-600';
    };

    // 비주얼 피드백 메시지 생성 함수
    const generateVisualFeedback = (visualOverall: any) => {
        if (!visualOverall) return '비주얼 분석 데이터가 없습니다.';

        const count = visualOverall.count || 0;
        const goodRatio = visualOverall.presence_dist?.good
            ? (visualOverall.presence_dist.good / count) * 100
            : 0;
        const eyeContact = (visualOverall.eye_contact_mean || 0) * 100;
        const engagement = (visualOverall.engagement_mean || 0) * 100;
        const confidence = (visualOverall.confidence_mean || 0) * 100;

        // 각 지표별 평가
        const getIndicatorStatus = (value: number, thresholds: { good: number; fair: number }) => {
            if (value >= thresholds.good) return { level: 'excellent', text: '우수' };
            if (value >= thresholds.fair) return { level: 'good', text: '양호' };
            return { level: 'poor', text: '개선 필요' };
        };

        const eyeContactStatus = getIndicatorStatus(eyeContact, { good: 80, fair: 60 });
        const engagementStatus = getIndicatorStatus(engagement, { good: 60, fair: 30 });
        const confidenceStatus = getIndicatorStatus(confidence, { good: 60, fair: 30 });

        // 기본 메시지
        let message = `전체 면접 중 약 ${Math.round(goodRatio)}%의 시간이 자신감 있는 모습으로 진행되었습니다.`;

        // 각 지표별 상세 피드백
        const details = [];

        if (eyeContactStatus.level === 'excellent') {
            details.push(`시선 접촉(${Math.round(eyeContact)}%)이 매우 우수합니다`);
        } else if (eyeContactStatus.level === 'good') {
            details.push(`시선 접촉(${Math.round(eyeContact)}%)은 양호합니다`);
        } else {
            details.push(`시선 접촉(${Math.round(eyeContact)}%) 개선이 필요합니다`);
        }

        if (engagementStatus.level === 'excellent') {
            details.push(`몰입도(${Math.round(engagement)}%)가 매우 우수합니다`);
        } else if (engagementStatus.level === 'good') {
            details.push(`몰입도(${Math.round(engagement)}%)는 양호합니다`);
        } else {
            details.push(`몰입도(${Math.round(engagement)}%) 개선이 필요합니다`);
        }

        if (confidenceStatus.level === 'poor') {
            details.push(`자신감(${Math.round(confidence)}%) 개선이 필요합니다`);
        }

        return message + ' ' + details.join(', ') + '.';
    };

    // 로딩 상태
    if (isLoading) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                {showAudioAnalysis && (
                    <Card className='border-0 shadow-lg'>
                        <CardContent className='p-6'>
                            <div className='animate-pulse'>
                                <div className='h-6 bg-gray-200 rounded mb-2'></div>
                                <div className='h-4 bg-gray-200 rounded mb-4'></div>
                                <div className='h-8 bg-gray-200 rounded'></div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {showVisualAnalysis && (
                    <Card className='border-0 shadow-lg'>
                        <CardContent className='p-6'>
                            <div className='animate-pulse'>
                                <div className='h-6 bg-gray-200 rounded mb-2'></div>
                                <div className='h-4 bg-gray-200 rounded mb-4'></div>
                                <div className='h-8 bg-gray-200 rounded'></div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    // 에러 상태
    if (hasError) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                <Card className='border-0 shadow-lg'>
                    <CardContent className='p-6'>
                        <div className='text-red-500'>음성/영상 분석을 불러올 수 없습니다.</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!audioData?.overall && !visualData?.overall) {
        return null;
    }

    // 오디오 점수 계산 함수
    const calculateVoiceScore = (audioOverall: any) => {
        if (!audioOverall) return 0;

        const toneScore = audioOverall.tone_score || 0;
        const vibratoScore = audioOverall.vibrato_score || 0;
        const paceScore = audioOverall.pace_score || 0;

        // 기본 점수 계산 (톤, 떨림, 속도 평균)
        const baseScore = (toneScore + vibratoScore + paceScore) / 3;

        // 침묵 비율에 따른 감점 (침묵이 많을수록 점수 감소)
        const silencePenalty = (audioOverall.silence_ratio || 0) * 20;

        return Math.max(0, Math.min(100, baseScore - silencePenalty));
    };

    // 비주얼 점수 계산 함수
    const calculateVisualScore = (visualOverall: any) => {
        if (!visualOverall) return 0;

        // presence_dist의 good 비율을 주요 지표로 사용 (실제 면접 상태)
        const count = visualOverall.count || 1;
        const goodRatio = visualOverall.presence_dist?.good
            ? (visualOverall.presence_dist.good / count) * 100
            : 0;

        // 보조 지표들
        const eyeContactScore = (visualOverall.eye_contact_mean || 0) * 100;
        const engagementScore = (visualOverall.engagement_mean || 0) * 100;
        const confidenceScore = (visualOverall.confidence_mean || 0) * 100;

        // goodRatio가 80% 이상이면 기본적으로 높은 점수 부여
        if (goodRatio >= 80) {
            // 80% 이상이면 최소 70점 이상 보장
            const baseScore = 70 + (goodRatio - 80) * 0.5; // 80% = 70점, 100% = 80점
            const bonusScore =
                eyeContactScore * 0.1 + engagementScore * 0.1 + confidenceScore * 0.1;
            return Math.min(100, baseScore + bonusScore);
        } else if (goodRatio >= 60) {
            // 60-79%면 60-69점 범위
            const baseScore = 60 + (goodRatio - 60) * 0.5;
            const bonusScore =
                eyeContactScore * 0.15 + engagementScore * 0.15 + confidenceScore * 0.1;
            return Math.min(69, baseScore + bonusScore);
        } else {
            // 60% 미만이면 다른 지표들도 고려
            return (
                goodRatio * 0.4 +
                eyeContactScore * 0.3 +
                engagementScore * 0.2 +
                confidenceScore * 0.1
            );
        }
    };

    return (
        <div className='space-y-8 mb-8'>
            {/* 기본 카드들 */}
            <div className='p-8 border-none box-shadow-none bg-[#EBFAFF]'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {audioData?.overall && showAudioAnalysis && (
                        <Card className='border-0 shadow-none'>
                            <CardContent className='p-6'>
                                <div className='flex flex-col gap-4'>
                                    <div className='text-xl text-gray-800 mb-1'>
                                        보이스{' '}
                                        <span
                                            className={`text-2xl font-semibold ${getScoreColor(calculateVoiceScore(audioData.overall))}`}
                                        >
                                            {getScoreLevel(calculateVoiceScore(audioData.overall))}
                                        </span>
                                    </div>
                                    <div className='flex flex-1 gap-8'>
                                        <div className='w-[60px] h-[60px] flex-shrink-0 relative'>
                                            <Image
                                                src='/svgs/voice.svg'
                                                alt='voice-analysis'
                                                fill
                                                className='object-cover'
                                            />
                                        </div>
                                        <div className='text-gray-600 text-lg'>
                                            {(() => {
                                                const scores = audioData?.overall;
                                                if (!scores) return '음성 분석 데이터가 없습니다.';

                                                const parts = [];
                                                if (scores.tone_score && scores.tone_score >= 80)
                                                    parts.push('안정적인 톤');
                                                if (
                                                    scores.vibrato_score &&
                                                    scores.vibrato_score >= 80
                                                )
                                                    parts.push('떨림이 적은 목소리');
                                                if (scores.pace_score && scores.pace_score >= 80)
                                                    parts.push('적정한 속도');

                                                return parts.length > 0
                                                    ? `${parts.join(' · ')}로 면접을 진행했어요.`
                                                    : '면접을 보는 동안 목소리의 높낮이가 일정하지 않고 말의 속도가 적절하지 않았어요. 좀 더 차분하고 적절한 속도로 면접을 진행해보세요.';
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {visualData?.overall && showVisualAnalysis && (
                        <Card className='border-0 shadow-none'>
                            <CardContent className='p-6'>
                                <div className='flex flex-col gap-4'>
                                    <div className='text-2xl text-gray-800 mb-1'>
                                        행동{' '}
                                        <span
                                            className={`text-2xl font-semibold ${getScoreColor(calculateVisualScore(visualData?.overall))}`}
                                        >
                                            {getScoreLevel(
                                                calculateVisualScore(visualData?.overall),
                                            )}
                                        </span>
                                    </div>
                                    <div className='flex flex-1 gap-8'>
                                        <div className='w-[60px] h-[60px] flex-shrink-0 relative'>
                                            <Image
                                                src='/svgs/face.svg'
                                                alt='visual-analysis'
                                                fill
                                                className='object-cover'
                                            />
                                        </div>

                                        <div className='text-gray-600 text-lg'>
                                            {generateVisualFeedback(visualData?.overall)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
