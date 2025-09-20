'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Mic } from 'lucide-react';
import AiInterviewResultCard from './AiInterviewResultCard';
import { api } from '@/apis/api';

// API 응답 형식에 맞는 타입 정의
export interface AiInterviewReport {
    session_id: string;
    ended_at: Date | null;
    resume_title: string | null;
    duration_minutes: number | null;
    self_intro_script: string | null;
}

// AI 인터뷰 리포트 목록 조회 API
const getAiInterviewReports = async () => {
    const response = await api.get('/report/my');
    console.log('내 AI 인터뷰 목록', response);
    return response.data;
};

interface AiInterviewResultSectionProps {
    showAll?: boolean;
    onShowAll?: () => void;
}

export default function AiInterviewResultSection({
    showAll = false,
    onShowAll,
}: AiInterviewResultSectionProps) {
    const {
        data: reportData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['ai-interview-reports'],
        queryFn: async () => {
            const response = await getAiInterviewReports();
            if (response?.success && response?.data) {
                return response.data;
            }
            throw new Error('AI 인터뷰 결과를 불러올 수 없습니다.');
        },
        retry: 1,
    });

    const results = reportData || [];
    const displayResults = showAll ? results : results.slice(0, 3);
    const hasMore = results.length > 3;

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='p-2 bg-blue-100 rounded-lg'>
                        <Mic className='h-6 w-6 text-blue-600' />
                    </div>
                    <div>
                        <h3 className='text-xl font-semibold'>AI 인터뷰 결과</h3>
                        <p className='text-sm text-muted-foreground'>
                            AI와 함께한 모의 면접 결과를 확인하세요
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className='hover:shadow-md transition-shadow'>
                            <CardContent className='p-6'>
                                <Skeleton className='h-4 w-3/4 mb-2' />
                                <Skeleton className='h-4 w-1/2 mb-4' />
                                <Skeleton className='h-8 w-20' />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : error ? (
                <div className='text-center py-12 bg-muted/30 rounded-lg'>
                    <p className='text-muted-foreground'>AI 인터뷰 결과를 불러올 수 없습니다.</p>
                </div>
            ) : results.length === 0 ? (
                <div className='text-center py-12 bg-muted/30 rounded-lg'>
                    <p className='text-muted-foreground'>아직 AI 인터뷰 결과가 없습니다</p>
                </div>
            ) : (
                <>
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                        {displayResults.map((result: AiInterviewReport) => (
                            <AiInterviewResultCard key={result.session_id} result={result} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
