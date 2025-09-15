import { CoachingResumeResultCard } from '../_components';
import { mockCoachingResumeResults } from '../_lib/mock-data';

export default function CoachingResumeResultPage() {
    return (
        <div className='space-y-6'>
            <div className='bg-card rounded-lg border p-6'>
                <h2 className='text-2xl font-semibold mb-4'>이력서 코칭 결과</h2>
                <p className='text-muted-foreground'>
                    나의 이력서 코칭 결과를 확인하고 피드백을 받아보세요.
                </p>
            </div>

            {mockCoachingResumeResults.length > 0 ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {mockCoachingResumeResults.map((result) => (
                        <CoachingResumeResultCard key={result.id} result={result} />
                    ))}
                </div>
            ) : (
                <div className='text-center py-12'>
                    <p className='text-muted-foreground'>아직 코칭 결과가 없습니다.</p>
                </div>
            )}
        </div>
    );
}
