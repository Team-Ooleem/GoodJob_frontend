import { useInfiniteQuery } from '@tanstack/react-query';
import { SocialApi } from '../_apis/social.api';

/**
 * 포스트 목록을 무한스크롤로 관리하는 훅
 */
export const usePosts = (currentUserId: number) => {
    return useInfiniteQuery({
        queryKey: ['posts', currentUserId],
        queryFn: ({ pageParam }) => SocialApi.getPosts(currentUserId, 5, pageParam),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => {
            if (!lastPage.hasMore || !lastPage.posts.length) {
                return undefined;
            }
            const lastPostIdx = lastPage.posts[lastPage.posts.length - 1].postIdx;
            return lastPostIdx;
        },
    });
};
