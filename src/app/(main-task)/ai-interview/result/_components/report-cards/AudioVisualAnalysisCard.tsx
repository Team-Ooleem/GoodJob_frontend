// result/_components/AudioVisualAnalysisCard.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Smile } from 'lucide-react';
import { api } from '@/apis/api';

// 타입 정의
interface AudioAnalysisData {
    overall?: {
        f0_mean?: number;
        f0_std?: number;
        f0_cv?: number;
        rms_cv?: number;
        jitter_like?: number;
        shimmer_like?: number;
        silence_ratio?: number;
        tone_score?: number;
        vibrato_score?: number;
        pace_score?: number;
        overall_voice_score?: number;
    };
    perQuestion?: Array<{
        questionNumber: number;
        question: string;
        audioUrl?: string;
        tone_score?: number;
        vibrato_score?: number;
        pace_score?: number;
        audioFeatures?: any;
    }>;
}

interface VisualAnalysisData {
    overall?: {
        count?: number;
        confidence_mean?: number;
        smile_mean?: number;
        eye_contact_mean?: number;
        gaze_stability?: number;
        presence_dist?: {
            good?: number;
            average?: number;
            needs_improvement?: number;
        };
        level_dist?: {
            ok?: number;
            warning?: number;
            critical?: number;
        };
        confidence_score?: number;
        behavior_score?: number;
        overall_visual_score?: number;
    };
    perQuestion?: Record<string, any>;
}

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
            console.log('🔍 AudioVisualAnalysisCard - 오디오 메트릭스 API 호출 시작:', sessionId);
            const response = await getAudioMetrics(sessionId);
            console.log('📊 AudioVisualAnalysisCard - 오디오 메트릭스 API 응답:', response);
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
            console.log('🔍 AudioVisualAnalysisCard - 비주얼 메트릭스 API 호출 시작:', sessionId);
            const response = await getVisualMetrics(sessionId);
            console.log('📊 AudioVisualAnalysisCard - 비주얼 메트릭스 API 응답:', response);
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

        const confidenceScore = visualOverall.confidence_score || 0;
        const behaviorScore = visualOverall.behavior_score || 0;

        return (confidenceScore + behaviorScore) / 2;
    };

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            {audioData?.overall && showAudioAnalysis && (
                <Card className='border-0 shadow-lg'>
                    <CardContent className='p-6'>
                        <div className='flex items-start gap-4'>
                            <div className='text-4xl text-blue-500'>
                                <Volume2 />
                            </div>
                            <div className='flex-1'>
                                <div className='text-xl text-gray-800 mb-1'>
                                    보이스{' '}
                                    <span className='text-blue-500 font-semibold'>
                                        {getScoreLevel(calculateVoiceScore(audioData.overall))}
                                    </span>
                                </div>
                                <div className='text-gray-600'>
                                    {(() => {
                                        const scores = audioData?.overall;
                                        if (!scores) return '음성 분석 데이터가 없습니다.';

                                        const parts = [];
                                        if (scores.tone_score && scores.tone_score >= 80)
                                            parts.push('안정적인 톤');
                                        if (scores.vibrato_score && scores.vibrato_score >= 80)
                                            parts.push('떨림 적음');
                                        if (scores.pace_score && scores.pace_score >= 80)
                                            parts.push('적정 속도');

                                        return parts.length > 0
                                            ? `${parts.join(' · ')}로 발화했습니다.`
                                            : '톤 안정화와 속도 조절 연습을 권합니다.';
                                    })()}
                                </div>
                                <div className='mt-3'>
                                    <Button
                                        size='sm'
                                        onClick={() => setShowAudioDetails(!showAudioDetails)}
                                    >
                                        {showAudioDetails ? '지표 닫기' : '지표 확인하기'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {visualData?.overall && showVisualAnalysis && (
                <Card className='border-0 shadow-lg'>
                    <CardContent className='p-6'>
                        <div className='flex items-start gap-4'>
                            <div className='text-4xl text-blue-500'>
                                <Smile />
                            </div>
                            <div className='flex-1'>
                                <div className='text-xl text-gray-800 mb-1'>
                                    행동{' '}
                                    <span className='text-blue-500 font-semibold'>
                                        {getScoreLevel(calculateVisualScore(visualData?.overall))}
                                    </span>
                                </div>
                                <div className='text-gray-600'>
                                    {(() => {
                                        const v = visualData?.overall;
                                        if (!v) return '비주얼 분석 데이터가 없습니다.';

                                        const count = v.count || 0;
                                        const good =
                                            count && v.presence_dist?.good
                                                ? v.presence_dist.good / count
                                                : 0;
                                        return `전체 면접 중 약 ${Math.round(good * 100)}%의 시간이 자신감 있는 모습으로 진행되었습니다.`;
                                    })()}
                                </div>
                                <div className='mt-3'>
                                    <Button
                                        size='sm'
                                        onClick={() => setShowVisualDetails(!showVisualDetails)}
                                    >
                                        {showVisualDetails ? '지표 닫기' : '지표 확인하기'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
