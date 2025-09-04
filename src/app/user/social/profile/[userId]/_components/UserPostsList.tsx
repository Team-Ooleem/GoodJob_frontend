'use client';

import { Post, SocialApi } from '../../../_apis/social.api';
import { useState, useEffect } from 'react';
import { Button, Empty, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import PostItem from '../../../_components/PostItem';

interface UserPostsListProps {
    posts: Post[];
    hasMore: boolean;
    nextCursor?: number;
    targetUserId: string;
    onPostDeleted?: () => void;
    onPostUpdated?: () => void;
}

export default function UserPostsList({
    posts,
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
    targetUserId,
    onPostDeleted,
    onPostUpdated,
}: UserPostsListProps) {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [allPosts, setAllPosts] = useState<Post[]>(posts);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);

    // localStorage에서 현재 사용자 ID 가져오기
    useEffect(() => {
        const userId = localStorage.getItem('user_idx');
        if (userId) {
            setCurrentUserId(parseInt(userId, 10));
        }
    }, []);

    // 초기 포스트 설정
    useEffect(() => {
        setAllPosts(posts);
        setHasMore(initialHasMore);
        setNextCursor(initialNextCursor);
    }, [posts, initialHasMore, initialNextCursor]);

    const handleLoadMore = async () => {
        if (!hasMore || !nextCursor || !currentUserId) return;

        setIsLoadingMore(true);
        try {
            const response = await SocialApi.getUserPosts(
                targetUserId,
                currentUserId,
                10,
                nextCursor,
            );
            setAllPosts((prev) => [...prev, ...response.posts]);
            setHasMore(response.hasMore);
            setNextCursor(response.nextCursor);
        } catch (error) {
            console.error('포스트 로드 실패:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    if (allPosts?.length === 0) {
        return (
            <div className='text-center py-12'>
                <Empty
                    description='아직 작성한 포스트가 없습니다.'
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        );
    }

    return (
        <div className='space-y-4'>
            {/* 포스트 목록 */}
            {allPosts?.map((post) => (
                <PostItem
                    key={post.postIdx}
                    post={post}
                    currentUserId={currentUserId || 0}
                    onPostDeleted={onPostDeleted}
                    onPostUpdated={onPostUpdated}
                />
            ))}

            {/* 더 보기 버튼 */}
            {hasMore && (
                <div className='text-center py-6'>
                    <Button
                        onClick={handleLoadMore}
                        loading={isLoadingMore}
                        icon={<ReloadOutlined />}
                        size='large'
                        className='w-full max-w-xs'
                    >
                        {isLoadingMore ? '로딩 중...' : '더 많은 포스트 보기'}
                    </Button>
                </div>
            )}

            {/* 로딩 상태 */}
            {isLoadingMore && (
                <div className='text-center py-4'>
                    <Spin size='large' />
                </div>
            )}
        </div>
    );
}
