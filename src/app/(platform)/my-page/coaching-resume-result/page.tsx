'use client';

import { useAuth } from '@/hooks/use-auth';
import { CoachingResumeResultCard } from '../_components';
import { mockCoachingResumeResults } from '../_lib/mock-data';
import { useMentoringApplications } from '../_hooks/useMentoringApplications';

export default function CoachingResumeResultPage() {
    // 인증 훅에서 실제 사용자 ID 사용
    const { user } = useAuth();
    const user_idx = user?.idx ?? 0;
    const { data: mentoringData, isLoading, error } = useMentoringApplications({ user_idx });
    const mentoringApplications = mentoringData?.applications || [];

    if (isLoading) {
        return (
            <div className='space-y-8'>
                <div className='bg-card rounded-lg border p-6'>
                    <h2 className='text-2xl font-semibold mb-4'>마이페이지 홈</h2>
                    <p className='text-muted-foreground'>로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            <div className='bg-card rounded-lg border p-6'>
                <h2 className='text-2xl font-semibold mb-4'>이력서 코칭 결과</h2>
                <p className='text-muted-foreground'>
                    나의 이력서 코칭 결과를 확인하고 피드백을 받아보세요.
                </p>
            </div>

            {mentoringApplications.length > 0 ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {mentoringApplications.map((result) => {
                        return (
                            <CoachingResumeResultCard
                                key={result.application_id}
                                application={result}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className='text-center py-12'>
                    <p className='text-muted-foreground'>아직 코칭 결과가 없습니다.</p>
                </div>
            )}
        </div>
    );
}
