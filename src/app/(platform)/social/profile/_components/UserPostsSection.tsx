'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { ProfileApi } from '../_apis/profile.api';
import { useUserProfile } from '../_hooks/useUserProfile';
import { PostItem } from '../../_components';
import { MentorIntroduction } from './MentorIntroduction';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface UserPostsSectionProps {
    userId: number;
    currentUserId: number;
}

export function UserPostsSection({ userId, currentUserId }: UserPostsSectionProps) {
    const [refreshing, setRefreshing] = useState(false);

    // 사용자 프로필 조회 (멘토 정보 확인용)
    const { data: userProfile } = useUserProfile(userId);

    // 사용자 포스트 무한스크롤 쿼리
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['userPosts', userId, currentUserId],
        queryFn: ({ pageParam }) => ProfileApi.getUserPosts(userId, currentUserId, 10, pageParam),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => {
            if (lastPage.hasMore && lastPage.nextCursor) {
                return lastPage.nextCursor;
            }
            return undefined;
        },
        enabled: !!userId && !!currentUserId,
    });

    // 스크롤 이벤트 핸들러
    const handleScroll = useCallback(() => {
        if (
            window.innerHeight + document.documentElement.scrollTop >=
            document.documentElement.offsetHeight - 1000
        ) {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // 스크롤 이벤트 리스너 등록
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    // 새로고침 핸들러
    const handleRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    // 모든 포스트를 하나의 배열로 합치기
    const allPosts = data?.pages.flatMap((page) => page.posts) || [];

    // 포스트 업데이트 콜백
    const handlePostUpdated = () => {
        refetch();
    };

    // 포스트 삭제 콜백
    const handlePostDeleted = () => {
        refetch();
    };

    if (isLoading) {
        return (
            <div className='space-y-6'>
                <div className='p-6 text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
                    <p className='text-muted-foreground mt-4'>포스트를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className='space-y-6'>
                <div className='p-6 text-center'>
                    <p className='text-destructive mb-4'>포스트를 불러오는데 실패했습니다.</p>
                    <Button onClick={handleRefresh} variant='outline'>
                        <RefreshCw className='h-4 w-4 mr-2' />
                        다시 시도
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-6 p-6'>
            {/* 멘토 소개글 (멘토인 경우) */}
            {userProfile?.isMentor && userProfile?.mentorProfile?.introduction && (
                <>
                    <MentorIntroduction
                        introduction={userProfile.mentorProfile.introduction}
                        businessName={userProfile.mentorProfile?.businessName || ''}
                        preferredField={userProfile.mentorProfile?.preferredField || ''}
                    />
                    <Separator className='mb-6' />
                </>
            )}

            {/* 포스트 섹션 */}
            <div>
                <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-2xl font-semibold'>게시글</h2>
                </div>
                <div className='p-6'>
                    {!allPosts || allPosts.length === 0 ? (
                        <div className='text-center py-12'>
                            <p className='text-muted-foreground'>아직 작성한 게시글이 없습니다.</p>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {allPosts?.map((post) => (
                                <PostItem
                                    key={post?.postIdx}
                                    post={post}
                                    currentUserId={currentUserId}
                                    onPostUpdated={handlePostUpdated}
                                    onPostDeleted={handlePostDeleted}
                                />
                            ))}

                            {/* 로딩 인디케이터 */}
                            {isFetchingNextPage && (
                                <div className='flex justify-center py-8'>
                                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
                                </div>
                            )}

                            {/* 더 이상 불러올 포스트가 없을 때 */}
                            {!hasNextPage && allPosts && allPosts.length > 0 && (
                                <div className='text-center py-8 text-muted-foreground'>
                                    모든 게시글을 불러왔습니다.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
