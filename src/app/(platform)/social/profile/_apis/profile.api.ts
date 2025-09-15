import { api } from '@/apis/api';
import { UserProfileResponse, PostsResponse } from '../../_apis/social.api';

/**
 * 사용자 프로필 관련 API
 */
export class ProfileApi {
    /**
     * 사용자 프로필 조회 API
     */
    static async getUserProfile(userId: number): Promise<UserProfileResponse> {
        const response = await api.get<UserProfileResponse>(`/social/profile/${userId}`);
        return response.data;
    }

    /**
     * 특정 사용자의 포스트 목록 조회 (무한스크롤)
     */
    static async getUserPosts(
        userId: number,
        currentUserId: number,
        limit: number = 10,
        cursor?: number,
    ): Promise<PostsResponse> {
        if (limit < 1 || limit > 20) {
            throw new Error('limit은 1-20 사이의 값이어야 합니다.');
        }

        const params = new URLSearchParams({
            currentUserId: currentUserId.toString(),
            limit: limit.toString(),
        });

        if (cursor !== undefined) {
            params.append('cursor', cursor.toString());
        }

        try {
            const url = `/social/posts/user/${userId}?${params.toString()}`;

            const response = await api.get<PostsResponse>(url);
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }
}
