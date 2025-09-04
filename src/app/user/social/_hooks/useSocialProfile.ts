import { useQuery } from '@tanstack/react-query';
import { SocialApi } from '../_apis/social.api';

/**
 * 소셜 프로필 데이터를 관리하는 훅
 */
export const useSocialProfile = (userId: string) => {
    return useQuery({
        queryKey: ['socialProfile', userId],
        queryFn: () => SocialApi.getProfile(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5분
    });
};
