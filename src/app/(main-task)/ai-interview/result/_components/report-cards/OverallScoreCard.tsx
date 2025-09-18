// result/_components/OverallScoreCard.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, CheckCircle, AlertTriangle } from 'lucide-react';
import type { InterviewAnalysisResult } from '@/types/report';

interface OverallScoreCardProps {
    analysisResult: InterviewAnalysisResult;
    compact?: boolean;
}

export default function OverallScoreCard({
    analysisResult,
    compact = false,
}: OverallScoreCardProps) {
    // 점수 관련 유틸리티 함수들
    const getScoreColor = (score: number) => {
        if (score >= 90) return '#52c41a';
        if (score >= 80) return '#1890ff';
        if (score >= 70) return '#faad14';
        return '#ff4d4f';
    };

    const getScoreLevel = (score: number) => {
        if (score >= 90) return '우수';
        if (score >= 80) return '양호';
        if (score >= 70) return '보통';
        return '개선 필요';
    };

    const getScoreIcon = (score: number) => {
        if (score >= 90) return <Trophy className='text-yellow-500' />;
        if (score >= 80) return <Star className='text-blue-500' />;
        if (score >= 70) return <CheckCircle className='text-orange-500' />;
        return <AlertTriangle className='text-red-500' />;
    };

    return (
        <Card className='border-0 shadow-lg mb-8'>
            <CardContent className='text-center pt-6'>
                <div className='flex items-center justify-center mb-4'>
                    {getScoreIcon(analysisResult.overall_score)}
                    <div
                        className={`${compact ? 'text-4xl' : 'text-6xl'} font-bold ml-4`}
                        style={{ color: getScoreColor(analysisResult.overall_score) }}
                    >
                        {analysisResult.overall_score}점
                    </div>
                </div>
                <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 mb-2`}>
                    {getScoreLevel(analysisResult.overall_score)}
                </h2>
                <div className='max-w-md mx-auto'>
                    <Progress value={analysisResult.overall_score} className='h-3' />
                </div>
            </CardContent>
        </Card>
    );
}
