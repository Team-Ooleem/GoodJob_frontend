import { useQuery } from '@tanstack/react-query';
import { SocialApi } from '../_apis/social.api';

/**
 * 댓글 목록을 관리하는 훅
 */
export const useComments = (postId: number, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['comments', postId],
        queryFn: () => SocialApi.getComments(postId),
        enabled: enabled,
        staleTime: 2 * 60 * 1000, // 2분
    });
};
