import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SocialApi } from '../../../_apis/social.api';
import { useAuth } from '@/hooks';

export function useUserPosts(targetUserId: string, limit: number = 10, cursor?: number) {
    const { user } = useAuth();
    const currentUserId = user?.idx || null;
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['userPosts', targetUserId, currentUserId, limit, cursor],
        queryFn: () => {
            if (!currentUserId) {
                throw new Error('사용자 ID가 없습니다.');
            }
            return SocialApi.getUserPosts(targetUserId, currentUserId, limit, cursor);
        },
        enabled: !!currentUserId && !!targetUserId,
    });

    // 쿼리 무효화 함수
    const invalidateUserPosts = () => {
        queryClient.invalidateQueries({
            queryKey: ['userPosts', targetUserId],
        });
    };

    return {
        ...query,
        invalidateUserPosts,
    };
}
