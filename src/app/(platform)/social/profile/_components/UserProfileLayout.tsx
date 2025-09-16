'use client';

import { useAuth } from '@/hooks/use-auth';
import { UserProfileSection } from './UserProfileSection';
import { UserPostsSection } from './UserPostsSection';

interface UserProfileLayoutProps {
    userId: number;
}

export function UserProfileLayout({ userId }: UserProfileLayoutProps) {
    // 현재 사용자 정보 조회
    const { user: currentUser, isLoading: currentUserLoading, isAuthenticated } = useAuth();

    if (currentUserLoading) {
        return (
            <div className='flex justify-center items-center h-64'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
        );
    }

    if (!isAuthenticated || !currentUser) {
        return (
            <div className='p-8 text-center'>
                <p className='text-muted-foreground'>로그인이 필요합니다.</p>
            </div>
        );
    }

    return (
        <div className='max-w-7xl mx-auto h-full'>
            <div className='flex gap-6 h-full'>
                {/* 왼쪽: 사용자 프로필 정보 */}
                <div className='w-80'>
                    <UserProfileSection userId={userId} currentUserId={currentUser.idx} />
                </div>

                {/* 오른쪽: 멘토 정보 및 포스트 */}
                <div className='min-h-screen space-y-6 border-l flex-1'>
                    <UserPostsSection userId={userId} currentUserId={currentUser.idx} />
                </div>
            </div>
        </div>
    );
}
