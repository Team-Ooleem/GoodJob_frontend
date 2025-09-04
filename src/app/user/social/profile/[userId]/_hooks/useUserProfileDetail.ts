import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SocialApi } from '../../../_apis/social.api';
import { useEffect, useState } from 'react';

export function useUserProfileDetail(
    targetUserId: string,
    postsLimit: number = 10,
    postsCursor?: number,
) {
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const queryClient = useQueryClient();

    // localStorage에서 현재 사용자 ID 가져오기
    useEffect(() => {
        const userId = localStorage.getItem('user_idx');
        if (userId) {
            setCurrentUserId(parseInt(userId, 10));
        }
    }, []);

    const query = useQuery({
        queryKey: ['userProfileDetail', targetUserId, currentUserId, postsLimit, postsCursor],
        queryFn: () => {
            // currentUserId가 없어도 프로필 조회는 가능하도록 수정
            return SocialApi.getUserProfileDetail(
                targetUserId,
                currentUserId || 0, // currentUserId가 없으면 0으로 전달
                postsLimit,
                postsCursor,
            );
        },
        enabled: !!targetUserId, // targetUserId만 있으면 실행
    });

    // 쿼리 무효화 함수
    const invalidateUserProfile = () => {
        queryClient.invalidateQueries({
            queryKey: ['userProfileDetail', targetUserId],
        });
    };

    return {
        ...query,
        invalidateUserProfile,
    };
}
