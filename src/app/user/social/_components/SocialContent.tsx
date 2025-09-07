'use client';

import { useState, useEffect } from 'react';
import ProfileSection from './ProfileSection';
import PostComposer from './PostComposer';
import PostFeed from './PostFeed';
import { useAuth } from '@/hooks/use-auth';

export default function SocialContent() {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const { user, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (user?.idx) {
            setCurrentUserId(user.idx);
        }
    }, [user]);

    // 로딩 중이거나 currentUserId가 없으면 아무것도 렌더링하지 않음
    if (authLoading || !currentUserId) {
        return <div>Loading...</div>;
    }

    return (
        <div className='min-h-screen bg-gray-50 p-6'>
            <div className='max-w-4xl mx-auto flex gap-6'>
                {/* 왼쪽 프로필 섹션 */}
                <ProfileSection currentUserId={currentUserId} />

                {/* 가운데 메인 콘텐츠 */}
                <div className='flex-1 flex flex-col gap-2 space-y-6'>
                    {/* 글쓰기 UI */}
                    <PostComposer currentUserId={currentUserId} />

                    {/* 포스트 피드 */}
                    <PostFeed currentUserId={currentUserId} />
                </div>
            </div>
        </div>
    );
}
