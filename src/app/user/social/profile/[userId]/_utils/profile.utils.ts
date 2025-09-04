import { UserProfileDetailResponse, UserPostsResponse } from '../../../_apis/social.api';

/**
 * 프로필 상세 데이터에서 사용자 정보 추출
 */
export const extractUserInfo = (profileDetail?: UserProfileDetailResponse) => {
    return profileDetail?.userInfo;
};

/**
 * 프로필 상세 데이터와 포스트 데이터에서 포스트 정보 추출
 */
export const extractPostsData = (
    profileDetail?: UserProfileDetailResponse,
    postsData?: UserPostsResponse,
) => {
    return {
        posts: profileDetail?.posts || postsData?.posts || [],
        hasMore: profileDetail?.hasMore || postsData?.hasMore || false,
        nextCursor: profileDetail?.nextCursor || postsData?.nextCursor,
    };
};
