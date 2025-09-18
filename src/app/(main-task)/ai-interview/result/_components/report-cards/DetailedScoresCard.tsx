// result/_components/DetailedScoresCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, MessageCircle, Trophy } from 'lucide-react';
import { api } from '@/apis/api';

interface DetailedScoresCardProps {
    sessionId: string;
}

// API 호출 함수
const getDetailedScores = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/detailed-scores`);
    return response.data;
};

export default function DetailedScoresCard({ sessionId }: DetailedScoresCardProps) {
    // API 호출
    const {
        data: reportData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['detailed-scores', sessionId],
        queryFn: async () => {
            const response = await getDetailedScores(sessionId);
            if (response?.success && response?.data?.detailedScores) {
                return response.data.detailedScores;
            }
            throw new Error('상세 점수 데이터를 불러올 수 없습니다.');
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

    // 부분 점수(30/30/40)를 퍼센트(0-100)로 환산
    const pctOf = (v: number | undefined, max: number) => {
        const n = typeof v === 'number' ? v : 0;
        const clamped = Math.max(0, Math.min(max, n));
        return Math.round((clamped / max) * 100);
    };

    // 로딩 상태
    if (isLoading) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8'>
                {[1, 2, 3].map((i) => (
                    <Card key={i} className='border-0 shadow-lg text-center'>
                        <CardContent className='pt-6'>
                            <div className='animate-pulse'>
                                <div className='h-4 bg-gray-200 rounded mb-2'></div>
                                <div className='h-8 bg-gray-200 rounded'></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // 에러 상태
    if (error || !reportData) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8'>
                <Card className='border-0 shadow-lg text-center col-span-full'>
                    <CardContent className='pt-6'>
                        <div className='text-red-500'>상세 점수를 불러올 수 없습니다.</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const detailedScores = reportData;

    return (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8'>
            <Card className='border-0 shadow-lg text-center'>
                <CardContent className='pt-6'>
                    <div className='text-sm text-muted-foreground mb-2'>내용</div>
                    <div className='flex items-center justify-center gap-2'>
                        <CheckCircle className='text-green-500 w-5 h-5' />
                        <div
                            className='text-3xl font-bold'
                            style={{
                                color: getScoreColor(pctOf(detailedScores?.content30, 30)),
                            }}
                        >
                            {detailedScores?.content30 ?? 0}
                        </div>
                        <span className='text-lg text-muted-foreground'>/ 30</span>
                    </div>
                </CardContent>
            </Card>
            <Card className='border-0 shadow-lg text-center'>
                <CardContent className='pt-6'>
                    <div className='text-sm text-muted-foreground mb-2'>맥락</div>
                    <div className='flex items-center justify-center gap-2'>
                        <MessageCircle className='text-blue-500 w-5 h-5' />
                        <div
                            className='text-3xl font-bold'
                            style={{
                                color: getScoreColor(pctOf(detailedScores?.context30, 30)),
                            }}
                        >
                            {detailedScores?.context30 ?? 0}
                        </div>
                        <span className='text-lg text-muted-foreground'>/ 30</span>
                    </div>
                </CardContent>
            </Card>
            <Card className='border-0 shadow-lg text-center'>
                <CardContent className='pt-6'>
                    <div className='text-sm text-muted-foreground mb-2'>표현</div>
                    <div className='flex items-center justify-center gap-2'>
                        <Trophy className='text-yellow-500 w-5 h-5' />
                        <div
                            className='text-3xl font-bold'
                            style={{
                                color: getScoreColor(pctOf(detailedScores?.expression40, 40)),
                            }}
                        >
                            {detailedScores?.expression40 ?? 0}
                        </div>
                        <span className='text-lg text-muted-foreground'>/ 40</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
