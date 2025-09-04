import { useUserProfileDetail, useUserPosts } from './index';
import { extractUserInfo, extractPostsData } from '../_utils/profile.utils';

interface UseProfileDataProps {
    userId: string;
    postsLimit?: number;
}

export const useProfileData = ({ userId, postsLimit = 10 }: UseProfileDataProps) => {
    // 상세 프로필 정보 조회
    const {
        data: profileDetail,
        isLoading: detailLoading,
        error: detailError,
        refetch: refetchDetail,
        invalidateUserProfile,
    } = useUserProfileDetail(userId);

    // 포스트 데이터 조회
    const {
        data: postsData,
        isLoading: postsLoading,
        error: postsError,
        invalidateUserPosts,
    } = useUserPosts(userId, postsLimit);

    // 데이터 추출
    const userInfo = extractUserInfo(profileDetail);
    const { posts, hasMore, nextCursor } = extractPostsData(profileDetail, postsData);

    // 이벤트 핸들러
    const handleFollowChange = () => {
        invalidateUserProfile();
    };

    const handlePostUpdate = () => {
        invalidateUserProfile();
        invalidateUserPosts();
    };

    return {
        // 데이터
        userInfo,
        posts,
        hasMore,
        nextCursor,

        // 로딩 상태
        detailLoading,
        postsLoading,

        // 에러 상태
        detailError,
        postsError,

        // 액션
        handleFollowChange,
        handlePostUpdate,
        refetchDetail,
    };
};
