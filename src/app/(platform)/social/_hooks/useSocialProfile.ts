import { useQuery } from '@tanstack/react-query';
import { SocialApi, MyProfileInfo } from '../_apis/social.api';

/**
 * 내 프로필 데이터를 관리하는 훅
 */
export const useMyProfile = () => {
    return useQuery({
        queryKey: ['myProfile'],
        queryFn: () => SocialApi.getMyProfile(),
    });
};
