// result/page.tsx - 단순화된 메인 페이지
'use client';

import { InterviewReport } from './_components';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AiInterviewResultPage() {
    return (
        <div className='min-h-screen  bg-gradient-to-br from-gray-50 to-gray-100 py-8'>
            <div className='container w-7xl mx-auto px-4'>
                {/* 리포트 - sessionId는 컴포넌트 내부에서 자동으로 결정됨 */}
                <InterviewReport />

                {/* 액션 버튼 */}
                <div className='text-center mt-8'>
                    <div className='flex justify-center gap-4'>
                        <Link prefetch={true} href='/'>
                            <Button variant='outline' size='lg' className='flex items-center gap-2'>
                                <ArrowLeft className='w-4 h-4' />
                                메인으로 돌아가기
                            </Button>
                        </Link>
                        <Link prefetch={true} href='/ai-interview/select'>
                            <Button size='lg'>다시 면접하기</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
