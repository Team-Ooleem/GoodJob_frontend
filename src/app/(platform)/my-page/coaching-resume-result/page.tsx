'use client';

import { CoachingResumeResultSection } from '../_components';
import { useMentoringApplications } from '../_hooks/useMentoringApplications';

export default function CoachingResumeResultPage() {
    // TODO: 실제 사용자 ID를 가져와야 함 (예: 인증 컨텍스트에서)
    const user_idx = 1; // 임시 하드코딩

    const { data: mentoringData, isLoading, error } = useMentoringApplications({ user_idx });
    const mentoringApplications = mentoringData?.applications || [];

    return (
        <div className='space-y-6'>
            <div className='bg-card rounded-lg border p-6'>
                <h2 className='text-2xl font-semibold mb-4'>이력서 코칭 결과</h2>
                <p className='text-muted-foreground'>
                    나의 이력서 코칭 결과를 확인하고 피드백을 받아보세요.
                </p>
            </div>

            <CoachingResumeResultSection
                results={mentoringApplications}
                showAll={true}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
}
