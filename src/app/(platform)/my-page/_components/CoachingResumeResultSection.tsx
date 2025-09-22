'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, Star, Building2, Calendar, Edit3 } from 'lucide-react';
import CoachingResumeResultCard from './CoachingResumeResultCard';
import { MentoringApplication } from '../_lib/mock-data';

interface CoachingResumeResultSectionProps {
    results: MentoringApplication[];
    showAll?: boolean;
    onShowAll?: () => void;
    isLoading?: boolean;
    error?: Error | null;
}

export default function CoachingResumeResultSection({
    results,
    showAll = false,
    onShowAll,
    isLoading = false,
    error = null,
}: CoachingResumeResultSectionProps) {
    const displayResults = showAll ? results : results.slice(0, 3);
    const hasMore = results.length > 3;

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='p-2 bg-green-100 rounded-lg'>
                        <Edit3 className='h-6 w-6 text-green-600' />
                    </div>
                    <div>
                        <h3 className='text-xl font-semibold'>이력서 코칭 내역</h3>
                        <p className='text-sm text-muted-foreground'>
                            전문가의 이력서 코칭 결과를 확인하세요
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className='text-center py-12 bg-muted/30 rounded-lg'>
                    <Edit3 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <p className='text-muted-foreground'>로딩 중...</p>
                </div>
            ) : error ? (
                <div className='text-center py-12 bg-muted/30 rounded-lg'>
                    <Edit3 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <p className='text-red-500 mb-4'>데이터를 불러오는 중 오류가 발생했습니다</p>
                    <Button onClick={() => window.location.reload()}>다시 시도</Button>
                </div>
            ) : results.length === 0 ? (
                <div className='text-center py-12 bg-muted/30 rounded-lg'>
                    <Edit3 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <p className='text-muted-foreground mb-4'>아직 이력서 코칭 결과가 없습니다</p>
                    <Link prefetch={true} href='/mentoring/landing'>
                        <Button>이력서 코칭 시작하기</Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                        {displayResults.map((application) => (
                            <CoachingResumeResultCard
                                key={application.application_id}
                                application={application}
                            />
                        ))}
                    </div>

                    {!showAll && hasMore && (
                        <div className='text-center pt-4'>
                            <Button variant='outline' onClick={onShowAll}>
                                더보기 (전체 {results.length}개)
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
