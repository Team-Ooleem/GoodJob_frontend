'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Flex } from 'antd';

// global components
import { HeaderNavigation } from './HeaderNavigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '@/constants/config';
import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';

export function Header() {
    const router = useRouter();

    const { isAuthenticated, user, logout, isLoading } = useAuth();
    const [isMentor, setIsMentor] = useState<boolean>(false);
    const [loadingMentor, setLoadingMentor] = useState<boolean>(false);

    useEffect(() => {
        const load = async () => {
            if (!isAuthenticated) {
                setIsMentor(false);
                return;
            }
            try {
                setLoadingMentor(true);
                const res = await fetch(`${API_BASE_URL}/mentoring-applications/my/mentor-idx`, {
                    credentials: 'include',
                });
                if (!res.ok) throw new Error('멘토 여부 조회 실패');
                const json = await res.json();
                setIsMentor(Boolean(json?.is_mentor));
            } catch (e) {
                setIsMentor(false);
            } finally {
                setLoadingMentor(false);
            }
        };
        load();
    }, [isAuthenticated]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('로그아웃 오류:', error);
        }
    };

    return (
        <div className='w-full h-auto'>
            <div className='mx-auto max-w-[1300px] w-full px-4 md:px-6 h-[60px] flex justify-between items-center'>
                <HeaderNavigation />
                {/* TODO: 아래 div box의 사용 방법이 잘못됐습니다. 개선할 예정입니다. */}
                <div className='justify-center items-center gap-1.5'>
                    {isLoading || loadingMentor ? (
                        <Button variant='ghost' disabled={isLoading}>
                            로딩...
                        </Button>
                    ) : isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' className='flex items-center gap-2'>
                                    <Avatar className='h-8 w-8'>
                                        <AvatarImage src={user?.picture} alt={user?.name} />
                                        <AvatarFallback>
                                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className='hidden sm:inline'>{user?.name}님</span>
                                    <ChevronDown className='h-4 w-4' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>계정</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/my-page')}>
                                    마이페이지
                                </DropdownMenuItem>
                                {isMentor && (
                                    <DropdownMenuItem
                                        onClick={() => router.push('/admin/mentoring')}
                                    >
                                        멘토 관리자 페이지
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>로그아웃</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
                </div>
            </div>
            <Separator />
        </div>
    );
}
