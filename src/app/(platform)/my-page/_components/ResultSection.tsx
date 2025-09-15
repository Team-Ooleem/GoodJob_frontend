'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import AiInterviewResultCard from './AiInterviewResultCard';
import CoachingResumeResultCard from './CoachingResumeResultCard';
import { AiInterviewResult, CoachingResumeResult } from '../_lib/mock-data';

interface ResultSectionProps {
    title: string;
    href: string;
    results: AiInterviewResult[] | CoachingResumeResult[];
    type: 'ai-interview' | 'coaching-resume';
    showAll?: boolean;
    onShowAll?: () => void;
}

export default function ResultSection({
    title,
    href,
    results,
    type,
    showAll = false,
    onShowAll,
}: ResultSectionProps) {
    const displayResults = showAll ? results : results.slice(0, 3);
    const hasMore = results.length > 3;

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <h3 className='text-xl font-semibold'>{title}</h3>
            </div>

            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {displayResults.map((result) => (
                    <div key={result.id}>
                        {type === 'ai-interview' ? (
                            <AiInterviewResultCard result={result as AiInterviewResult} />
                        ) : (
                            <CoachingResumeResultCard result={result as CoachingResumeResult} />
                        )}
                    </div>
                ))}
            </div>

            {!showAll && hasMore && (
                <div className='text-center pt-4'>
                    <Button variant='outline' onClick={onShowAll}>
                        더보기 (전체 {results.length}개)
                    </Button>
                </div>
            )}
        </div>
    );
}
