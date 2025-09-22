'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Building2, Calendar, FileText, User } from 'lucide-react';
import { MentoringApplication } from '../_lib/mock-data';

interface CoachingResumeResultCardProps {
    application: MentoringApplication;
}

export default function CoachingResumeResultCard({ application }: CoachingResumeResultCardProps) {
    console.log(application);
    const startTime = new Date(application.start_time);
    const endTime = new Date(application.end_time);
    const now = new Date();
    const isUpcoming = startTime > now;
    const isCompleted = application.application_status === 'approved' && endTime < now;

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
        <Link prefetch={true} href={`/coaching-resume/${application.canvas_id}`}>
            <Card className='hover:shadow-md transition-shadow overflow-hidden'>
                {/* Thumbnail */}
                <div className='w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative'>
                    {isCompleted ? (
                        <FileText className='h-16 w-16 text-white' />
                    ) : (
                        <div className='text-center text-white'>
                            <div className='text-2xl font-bold mb-1'>준비 중</div>
                            <div className='text-sm opacity-80'>곧 시작됩니다</div>
                        </div>
                    )}
                    <div className='absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded'>
                        {isCompleted ? '완료' : isUpcoming ? '예정' : '진행중'}
                    </div>
                </div>
                <CardHeader className='pb-2 pt-3 px-3'>
                    <div className='flex items-start justify-between'>
                        <div className='space-y-1'>
                            <CardTitle className='text-lg'>{application.product_title}</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className='space-y-3 px-3 pb-3'>
                    <div className='flex items-center justify-between'>
                        <div className='flex flex-col items-center gap-4 text-sm text-muted-foreground'>
                            <div className='w-full flex justify-start items-center gap-1'>
                                <User className='h-4 w-4' />
                                <span>{application.mentor.business_name}</span>
                            </div>
                            <div className='flex w-full items-center gap-1'>
                                <Calendar className='h-3 w-3' />
                                <span className='text-xs'>
                                    {(() => {
                                        const date = new Date(application.start_time);
                                        const dateStr = date.toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        });
                                        const timeStr = `${date.getHours()}시`;
                                        return `${dateStr} ${timeStr}`;
                                    })()}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
