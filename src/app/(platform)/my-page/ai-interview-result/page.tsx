'use client';

import { useQuery } from '@tanstack/react-query';
import { AiInterviewResultCard, AiInterviewReport } from './_components';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/apis/api';

// AI 인터뷰 리포트 목록 조회 API
export const getAiInterviewReports = async () => {
    const response = await api.get('/report/my');
    return response.data;
};

export default function AiInterviewResultPage() {
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

    if (isLoading) {
        return (
            <div className='space-y-6'>
                <div className='bg-card rounded-lg border p-6'>
                    <h2 className='text-2xl font-semibold mb-4'>AI 인터뷰 결과</h2>
                    <p className='text-muted-foreground'>
                        나의 AI 모의면접 결과를 확인하고 분석해보세요.
                    </p>
                </div>
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
            </div>
        );
    }

    if (error || !reportData) {
        return (
            <div className='space-y-6'>
                <div className='bg-card rounded-lg border p-6'>
                    <h2 className='text-2xl font-semibold mb-4'>AI 인터뷰 결과</h2>
                    <p className='text-muted-foreground'>
                        나의 AI 모의면접 결과를 확인하고 분석해보세요.
                    </p>
                </div>
                <div className='text-center py-12'>
                    <p className='text-muted-foreground'>AI 인터뷰 결과를 불러올 수 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div className='bg-card rounded-lg border p-6'>
                <h2 className='text-2xl font-semibold mb-4'>AI 인터뷰 결과</h2>
                <p className='text-muted-foreground'>
                    나의 AI 모의면접 결과를 확인하고 분석해보세요.
                </p>
            </div>

            {reportData.length > 0 ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {reportData.map((result: AiInterviewReport) => (
                        <AiInterviewResultCard key={result.session_id} result={result} />
                    ))}
                </div>
            ) : (
                <div className='text-center py-12'>
                    <p className='text-muted-foreground'>아직 면접 결과가 없습니다.</p>
                </div>
            )}
        </div>
    );
}
