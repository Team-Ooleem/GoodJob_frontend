'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, Star, Building2, Calendar, Edit3 } from 'lucide-react';
import CoachingResumeResultCard from './CoachingResumeResultCard';
import { CoachingResumeResult } from '../_lib/mock-data';

interface CoachingResumeResultSectionProps {
    results: CoachingResumeResult[];
    showAll?: boolean;
    onShowAll?: () => void;
}

export default function CoachingResumeResultSection({
    results,
    showAll = false,
    onShowAll,
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
                        <h3 className='text-xl font-semibold'>이력서 코칭 결과</h3>
                        <p className='text-sm text-muted-foreground'>
                            전문가의 이력서 코칭 결과를 확인하세요
                        </p>
                    </div>
                </div>
            </div>

            {results.length === 0 ? (
                <div className='text-center py-12 bg-muted/30 rounded-lg'>
                    <Edit3 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <p className='text-muted-foreground mb-4'>아직 이력서 코칭 결과가 없습니다</p>
                    <Link href='/coaching-resume'>
                        <Button>이력서 코칭 시작하기</Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                        {displayResults.map((result) => (
                            <CoachingResumeResultCard key={result.id} result={result} />
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
