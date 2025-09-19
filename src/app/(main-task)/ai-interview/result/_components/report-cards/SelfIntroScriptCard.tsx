// result/_components/SelfIntroScriptCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText, Sparkles } from 'lucide-react';
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
        <Card className='border-0 shadow-lg mb-8 overflow-hidden'>
            {/* 헤더 섹션 */}
            <div className='bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4'>
                <div className='flex items-center gap-4'>
                    <div className='flex-shrink-0'>
                        <div className='w-12 h-12 bg-white/20 rounded-full flex items-center justify-center'>
                            <FileText className='w-6 h-6 text-white' />
                        </div>
                    </div>
                    <div className='flex-1'>
                        <h3 className='text-white text-xl font-semibold mb-1'>
                            AI 맞춤형 자기소개 대본
                        </h3>
                        <p className='text-slate-200 text-sm'>
                            당신의 이력서를 분석하여 최적화된 1분 자기소개를 추천합니다
                        </p>
                    </div>
                </div>
            </div>

            {/* 컨텐츠 섹션 */}
            <CardContent className='p-6 bg-white'>
                {selfIntroScript ? (
                    <div className='space-y-4'>
                        <div className='flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg'>
                            <Sparkles className='w-4 h-4' />
                            <span className='font-medium'>이력서 기반 맞춤 추천</span>
                        </div>
                        <div className='whitespace-pre-line text-gray-800 leading-relaxed text-base'>
                            {selfIntroScript}
                        </div>
                        <div className='pt-2 border-t border-gray-100'>
                            <p className='text-xs text-gray-500'>
                                💡 이 대본은 당신의 경력과 강점을 효과적으로 어필할 수 있도록 AI가
                                최적화했습니다.
                            </p>
                        </div>
                    </div>
                ) : (
                    <Alert>
                        <AlertTriangle className='h-4 w-4' />
                        <AlertDescription>
                            <div className='font-semibold mb-1'>맞춤형 대본 생성 중</div>
                            <div>
                                당신의 이력서를 분석하여 최적의 1분 자기소개 대본을 생성하고
                                있습니다. 잠시 후 새로고침해보세요.
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
