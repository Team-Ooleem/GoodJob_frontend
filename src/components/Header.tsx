'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Flex, Button } from 'antd';

// global components
import { HeaderNavigation } from './HeaderNavigation';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
    const { isAuthenticated, user, logout, isLoading } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('로그아웃 오류:', error);
        }
    };

    return (
        <div className='w-full h-auto border-b border-gray-200'>
            <div className='mx-auto max-w-[1400px] w-full px-4 md:px-6 h-[60px] flex justify-between items-center'>
                <Flex justify='center' align='center' gap={30}>
                    <Image
                        src='/assets/good-job-logo.webp'
                        alt='올인원 채용 플랫폼 굿잡'
                        width={40}
                        height={40}
                    />
                    <HeaderNavigation />
                </Flex>
                <Flex justify='center' align='center' gap={6}>
                    {isLoading ? (
                        <Button type='primary' loading>
                            로딩...
                        </Button>
                    ) : isAuthenticated ? (
                        <div className='flex items-center gap-2'>
                            <span className='text-sm text-gray-600'>
                                안녕하세요, {user?.name}님!
                            </span>
                            <Button type='primary' onClick={handleLogout}>
                                로그아웃
                            </Button>
                        </div>
                    ) : (
                        <Link href='/login'>
                            <Button type='primary'>로그인</Button>
                        </Link>
                    )}
                    <Button>기업 서비스</Button>
                </Flex>
            </div>
        </div>
    );
}
