'use client';

import { notFound } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { getAiInterviewReportById } from '../_components/api';

interface AiInterviewDetailPageProps {
    params: {
        id: string;
    };
}

export default function AiInterviewDetailPage({ params }: AiInterviewDetailPageProps) {
    const {
        data: result,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['ai-interview-report', params.id],
        queryFn: async () => {
            const response = await getAiInterviewReportById(params.id);
            if (response?.success && response?.data) {
                return response.data;
            }
            throw new Error('AI 인터뷰 결과를 불러올 수 없습니다.');
        },
        enabled: !!params.id,
        retry: 1,
    });

    if (isLoading) {
        return (
            <div className='space-y-6'>
                <div className='flex items-center gap-4'>
                    <Skeleton className='h-8 w-24' />
                    <div>
                        <Skeleton className='h-8 w-64 mb-2' />
                        <Skeleton className='h-4 w-32' />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className='h-6 w-32' />
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <Skeleton className='h-16' />
                            <Skeleton className='h-16' />
                            <Skeleton className='h-16' />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !result) {
        notFound();
    }

    const formatDate = (date: Date | null) => {
        if (!date) return '미완료';
        return new Date(date).toLocaleDateString('ko-KR');
    };

    const getDurationText = (duration: number | null) => {
        if (!duration) return '진행중';
        return `${duration}분`;
    };

    return (
        <div className='space-y-6'>
            {/* 헤더 */}
            <div className='flex items-center gap-4'>
                <Link href='/my-page/ai-interview-result'>
                    <Button variant='outline' size='sm'>
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        목록으로
                    </Button>
                </Link>
                <div>
                    <h1 className='text-2xl font-bold'>{result.resume_title || 'AI 인터뷰'}</h1>
                    <p className='text-muted-foreground'>세션 ID: {result.session_id}</p>
                </div>
            </div>

            {/* 기본 정보 */}
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <CardTitle>면접 정보</CardTitle>
                        <Badge variant={result.ended_at ? 'default' : 'secondary'}>
                            {result.ended_at ? '완료' : '진행중'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex items-center gap-2'>
                            <Calendar className='h-4 w-4 text-muted-foreground' />
                            <span className='text-sm'>면접일</span>
                            <span className='font-medium'>{formatDate(result.ended_at)}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                            <span className='text-sm'>소요시간</span>
                            <span className='font-medium'>
                                {getDurationText(result.duration_minutes)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 자기소개 스크립트 */}
            {result.self_intro_script && (
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <FileText className='h-5 w-5 text-blue-500' />
                            자기소개 스크립트
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                            {result.self_intro_script}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* 액션 버튼 */}
            <div className='flex gap-4 justify-end'>
                <Button variant='outline'>면접 다시보기</Button>
                <Button>피드백 저장</Button>
            </div>
        </div>
    );
}
