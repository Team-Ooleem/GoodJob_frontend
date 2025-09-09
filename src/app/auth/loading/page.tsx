'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, message } from 'antd';
import { handleAuthRedirect } from '@/utils/auth-redirect';

export default function AuthLoadingPage() {
    const router = useRouter();
    const [loadingText, setLoadingText] = useState('로그인 처리 중입니다...');

    useEffect(() => {
        const processAuth = async () => {
            try {
                setLoadingText('인증 정보를 확인하고 있습니다...');

                // 쿠키 저장을 위한 초기 지연
                await new Promise((resolve) => setTimeout(resolve, 300));

                setLoadingText('사용자 정보를 불러오고 있습니다...');

                // 온보딩 상태 확인 후 적절한 경로로 리다이렉트
                const redirectPath = await handleAuthRedirect();

                setLoadingText('페이지로 이동 중입니다...');
                await new Promise((resolve) => setTimeout(resolve, 200));

                router.push(redirectPath);
            } catch (error) {
                console.error('인증 처리 실패:', error);
                message.error('로그인 처리 중 오류가 발생했습니다. 다시 로그인해주세요.');
                router.push('/login');
            }
        };

        processAuth();
    }, [router]);

    return (
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-50'>
            <div className='text-center'>
                <Spin size='large' />
                <div className='mt-4 text-lg text-gray-600'>{loadingText}</div>
                <div className='mt-2 text-sm text-gray-400'>잠시만 기다려주세요</div>
            </div>
        </div>
    );
}
