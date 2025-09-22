'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, FileText } from 'lucide-react';

// API 응답 형식에 맞는 타입 정의
export interface AiInterviewReport {
    session_id: string;
    ended_at: Date | null;
    resume_title: string | null;
    duration_minutes: number | null;
    self_intro_script: string | null;
}

interface AiInterviewResultCardProps {
    result: AiInterviewReport;
}

export default function AiInterviewResultCard({ result }: AiInterviewResultCardProps) {
    const formatDate = (date: Date | null) => {
        if (!date) return '미완료';
        return new Date(date).toLocaleDateString('ko-KR');
    };

    const getDurationText = (duration: number | null) => {
        if (!duration) return '진행중';
        return `${duration}분`;
    };

    return (
        <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='pb-4 pt-4'>
                <div className='flex items-start justify-between'>
                    <h4 className='text-lg font-bold overflow-hidden whitespace-nowrap text-ellipsis'>
                        {result?.resume_title || 'AI 인터뷰'}
                    </h4>
                </div>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                            <Calendar className='h-4 w-4' />
                            <span>{formatDate(result?.ended_at)}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                            <Clock className='h-4 w-4' />
                            <span>{getDurationText(result?.duration_minutes)}</span>
                        </div>
                    </div>
                </div>

                {result.self_intro_script && (
                    <div className='pt-2 border-t'>
                        <div className='flex items-start gap-2'>
                            <FileText className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                            <p className='text-sm text-muted-foreground line-clamp-2'>
                                {result?.self_intro_script}
                            </p>
                        </div>
                    </div>
                )}

                <div className='flex items-center justify-end'>
                    <Link
                        prefetch={true}
                        href={`/my-page/ai-interview-result/${result?.session_id}`}
                    >
                        <Button variant='outline' size='sm'>
                            상세보기
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
