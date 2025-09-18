// result/_components/SelfIntroScriptCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/apis/api';
import type { InterviewAnalysisResult } from '@/types/report';

interface SelfIntroScriptCardProps {
    sessionId: string;
}

// API 호출 함수
const getSelfIntroScript = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/self-intro`);
    return response.data;
};

export default function SelfIntroScriptCard({ sessionId }: SelfIntroScriptCardProps) {
    // API 호출
    const {
        data: reportData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['self-intro-script', sessionId],
        queryFn: async () => {
            const response = await getSelfIntroScript(sessionId);
            if (response?.success && response?.data?.selfIntroScript) {
                return response.data.selfIntroScript;
            }
            throw new Error('자기소개 대본 데이터를 불러올 수 없습니다.');
        },
        enabled: !!sessionId,
        retry: 1,
    });

    // 로딩 상태
    if (isLoading) {
        return (
            <Card className='border-0 shadow-lg mb-8'>
                <CardHeader>
                    <CardTitle>1분 자기소개 대본</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='animate-pulse'>
                        <div className='h-4 bg-gray-200 rounded mb-2'></div>
                        <div className='h-4 bg-gray-200 rounded mb-2'></div>
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
                    <div className='text-red-500'>자기소개 대본을 불러올 수 없습니다.</div>
                </CardContent>
            </Card>
        );
    }

    const selfIntroScript = reportData;

    return (
        <Card className='border-0 shadow-lg mb-8'>
            <CardHeader>
                <CardTitle>1분 자기소개 대본</CardTitle>
            </CardHeader>
            <CardContent>
                {selfIntroScript ? (
                    <div className='whitespace-pre-line text-gray-800 leading-relaxed'>
                        {selfIntroScript}
                    </div>
                ) : (
                    <Alert>
                        <AlertTriangle className='h-4 w-4' />
                        <AlertDescription>
                            <div className='font-semibold mb-1'>대본 준비 중</div>
                            <div>
                                이력서 요약을 바탕으로 대본을 생성하고 있습니다. 잠시 후
                                새로고침해보세요.
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
