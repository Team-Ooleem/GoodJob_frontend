import { useQuery } from '@tanstack/react-query';
import { ProfileApi } from '../_apis/profile.api';

/**
 * 사용자 프로필 조회 훅
 */
export const useUserProfile = (userId: number) => {
    return useQuery({
        queryKey: ['userProfile', userId],
        queryFn: () => ProfileApi.getUserProfile(userId),
        enabled: !!userId && userId > 0,
    });
};
