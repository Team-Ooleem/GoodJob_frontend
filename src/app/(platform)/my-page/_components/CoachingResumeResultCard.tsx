'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Building2, Calendar, FileText } from 'lucide-react';
import { CoachingResumeResult } from '../_lib/mock-data';

interface CoachingResumeResultCardProps {
    result: CoachingResumeResult;
}

export default function CoachingResumeResultCard({ result }: CoachingResumeResultCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'bg-green-500';
        if (score >= 80) return 'bg-blue-500';
        if (score >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getScoreText = (score: number) => {
        if (score >= 90) return '우수';
        if (score >= 80) return '양호';
        if (score >= 70) return '보통';
        return '미흡';
    };

    return (
        <Card className='hover:shadow-md transition-shadow'>
            <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                    <div className='space-y-1'>
                        <CardTitle className='text-lg'>{result.title}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                            <Calendar className='h-4 w-4' />
                            <span>{result.date}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                            <FileText className='h-4 w-4' />
                            <span>이력서 코칭</span>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className={`w-3 h-3 rounded-full ${getScoreColor(result.score)}`} />
                        <span className='text-sm font-medium'>{getScoreText(result.score)}</span>
                    </div>
                </div>

                <div className='flex items-center justify-end'>
                    <Link href={`/my-page/coaching-resume-result/${result.id}`}>
                        <Button variant='outline' size='sm'>
                            상세보기
                        </Button>
                    </Link>
                </div>

                <div className='pt-2 border-t'>
                    <p className='text-sm text-muted-foreground line-clamp-2'>
                        {result.feedback.overall}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
