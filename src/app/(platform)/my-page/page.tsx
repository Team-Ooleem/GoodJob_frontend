'use client';

import { useState } from 'react';
import { AiInterviewResultSection, CoachingResumeResultSection } from './_components';
import { mockAiInterviewResults, mockCoachingResumeResults } from './_lib/mock-data';

export default function MyPage() {
    const [showAllAiInterview, setShowAllAiInterview] = useState(false);
    const [showAllCoachingResume, setShowAllCoachingResume] = useState(false);

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
                results={mockCoachingResumeResults}
                showAll={showAllCoachingResume}
                onShowAll={() => setShowAllCoachingResume(true)}
            />
        </div>
    );
}
