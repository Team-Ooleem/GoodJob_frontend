import { AiInterviewResultCard } from '../_components';
import { mockAiInterviewResults } from '../_lib/mock-data';

export default function AiInterviewResultPage() {
    return (
        <div className='space-y-6'>
            <div className='bg-card rounded-lg border p-6'>
                <h2 className='text-2xl font-semibold mb-4'>AI 인터뷰 결과</h2>
                <p className='text-muted-foreground'>
                    나의 AI 모의면접 결과를 확인하고 분석해보세요.
                </p>
            </div>

            {mockAiInterviewResults.length > 0 ? (
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                    {mockAiInterviewResults.map((result) => (
                        <AiInterviewResultCard key={result.id} result={result} />
                    ))}
                </div>
            ) : (
                <div className='text-center py-12'>
                    <p className='text-muted-foreground'>아직 면접 결과가 없습니다.</p>
                </div>
            )}
        </div>
    );
}
