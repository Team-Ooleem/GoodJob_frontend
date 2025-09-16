'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, Clock, Star, Building2, Calendar, Mic } from 'lucide-react';
import AiInterviewResultCard from './AiInterviewResultCard';
import { AiInterviewResult } from '../_lib/mock-data';

interface AiInterviewResultSectionProps {
    results: AiInterviewResult[];
    showAll?: boolean;
    onShowAll?: () => void;
}

export default function AiInterviewResultSection({
    results,
    showAll = false,
    onShowAll,
}: AiInterviewResultSectionProps) {
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

            {results.length === 0 ? (
                <div className='text-center py-12 bg-muted/30 rounded-lg'>
                    <Mic className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <p className='text-muted-foreground mb-4'>아직 AI 인터뷰 결과가 없습니다</p>
                    <Link href='/ai-interview'>
                        <Button>AI 인터뷰 시작하기</Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                        {displayResults.map((result) => (
                            <AiInterviewResultCard key={result.id} result={result} />
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
