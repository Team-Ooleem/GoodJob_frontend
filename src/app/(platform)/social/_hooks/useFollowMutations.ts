import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { SocialApi } from '../_apis/social.api';

/**
 * 팔로우 관련 뮤테이션을 관리하는 훅
 */
export const useFollowMutations = (currentUserId: number) => {
    const queryClient = useQueryClient();

    // 팔로우 토글 뮤테이션
    const followMutation = useMutation({
        mutationFn: (followingId: number) => SocialApi.toggleFollow(currentUserId, followingId),
        onSuccess: (data) => {
            message.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['posts', currentUserId] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || '팔로우 처리에 실패했습니다.';
            message.error(errorMessage);
        },
    });

    return {
        toggleFollow: followMutation,
    };
};
