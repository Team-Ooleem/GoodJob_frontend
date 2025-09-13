'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import { usePosts } from '../_hooks';
import PostItem from './PostItem';

interface PostFeedProps {
    currentUserId: number;
}

export default function PostFeed({ currentUserId }: PostFeedProps) {
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 무한스크롤 쿼리
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
        usePosts(currentUserId);

    // 무한스크롤 감지
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // 로딩 상태
    if (isLoading) {
        return (
            <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        const errorMessage =
            error instanceof Error ? error.message : '포스트를 불러오는데 실패했습니다.';
        return (
            <div className='text-center py-8'>
                <p className='text-destructive mb-4'>{errorMessage}</p>
                <Button onClick={() => window.location.reload()} variant='outline'>
                    다시 시도
                </Button>
            </div>
        );
    }

    // 포스트가 없는 경우
    if (!data?.pages[0]?.posts.length) {
        return (
            <div className='text-center py-8'>
                <p className='text-muted-foreground'>아직 포스트가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-2'>
            {/* 포스트 목록 */}
            {data?.pages
                ?.flatMap((page) => page.posts)
                .map((post) => (
                    <PostItem key={post.postIdx} post={post} currentUserId={currentUserId} />
                ))}

            {/* 무한스크롤 트리거 */}
            <div ref={loadMoreRef} className='py-4'>
                {isFetchingNextPage && (
                    <div className='flex justify-center'>
                        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
                    </div>
                )}
                {!hasNextPage && data.pages[0]?.posts.length > 0 && (
                    <div className='text-center py-4'>
                        <p className='text-muted-foreground'>모든 포스트를 불러왔습니다.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
