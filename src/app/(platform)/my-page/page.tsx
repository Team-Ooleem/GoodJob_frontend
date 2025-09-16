'use client';

import { useState } from 'react';
import { AiInterviewResultSection, CoachingResumeResultSection } from './_components';
import { mockAiInterviewResults } from './_lib/mock-data';
import { useMentoringApplications } from './_hooks/useMentoringApplications';

export default function MyPage() {
    const [showAllAiInterview, setShowAllAiInterview] = useState(false);
    const [showAllCoachingResume, setShowAllCoachingResume] = useState(false);

    // TODO: 실제 사용자 ID를 가져와야 함 (예: 인증 컨텍스트에서)
    const user_idx = 1; // 임시 하드코딩

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
        <div className='space-y-8'>
            <div className='bg-card rounded-lg border p-6'>
                <h2 className='text-2xl font-semibold mb-4'>마이페이지 홈</h2>
                <p className='text-muted-foreground'>
                    AI 인터뷰 결과와 이력서 코칭 결과를 확인할 수 있습니다.
                </p>
            </div>

            <AiInterviewResultSection
                results={mockAiInterviewResults}
                showAll={showAllAiInterview}
                onShowAll={() => setShowAllAiInterview(true)}
            />

            <CoachingResumeResultSection
                results={mentoringApplications}
                showAll={showAllCoachingResume}
                onShowAll={() => setShowAllCoachingResume(true)}
                isLoading={isLoading}
                error={error}
            />
        </div>
    );
}
