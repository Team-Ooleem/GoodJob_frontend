'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Flex } from 'antd';

// global components
import { HeaderNavigation } from './HeaderNavigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function Header() {
    const router = useRouter();

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
                        <Button variant='ghost' disabled={isLoading}>
                            로딩...
                        </Button>
                    ) : isAuthenticated ? (
                        <div className='flex items-center gap-2'>
                            <span className='text-sm text-gray-600'>
                                안녕하세요, {user?.name}님!
                            </span>
                            <Button variant='ghost' onClick={handleLogout}>
                                로그아웃
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => {
                                router.push('/login');
                            }}
                            variant='ghost'
                        >
                            로그인
                        </Button>
                    )}
                </Flex>
            </div>
        </div>
    );
}
