import { ZustandTest } from '@/components/zustand-test';
import { ReactQueryTest } from '@/components/react-query-test';

export default function Home() {
    return (
        <div className='font-sans min-h-screen p-8 pb-20 gap-16 sm:p-20'>
            <div className='max-w-6xl mx-auto space-y-8'>
                <div className='text-center'>
                    <h1 className='text-4xl font-bold text-gray-800 mb-4'>
                        Good Job - AI Mock Interview Platform
                    </h1>
                    <p className='text-xl text-gray-600'>간소화된 테스트 페이지</p>
                </div>

                {/* Zustand 테스트 */}
                <ZustandTest />

                {/* React Query 테스트 */}
                <ReactQueryTest />
            </div>
        </div>
    );
}
