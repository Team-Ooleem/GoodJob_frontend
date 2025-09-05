'use client';

import { useState, useEffect } from 'react';
import ProfileSection from './ProfileSection';
import PostComposer from './PostComposer';
import PostFeed from './PostFeed';

export default function SocialContent() {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // localStorage에서 user_idx 가져오기
    useEffect(() => {
        const userId = localStorage.getItem('user_idx');
        if (userId) {
            const parsedUserId = parseInt(userId, 10);
            if (!isNaN(parsedUserId)) {
                setCurrentUserId(parsedUserId);
            }
        }
        setIsLoading(false);
    }, []);

    // currentUserId가 없으면 아무것도 렌더링하지 않음
    if (!currentUserId) {
        return null;
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
