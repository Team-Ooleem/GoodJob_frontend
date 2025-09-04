import { api } from '@/apis/api';

// ===== 타입 정의 =====
export interface SocialProfile {
    name: string;
    profileImage: string | null;
    shortBio: string;
    bio: string;
    jobTitle: string;
    residence: string;
    currentPosition: string;
    followerCount: number;
    isFollowing?: boolean;
}

export interface Post {
    postIdx: number;
    userId: number;
    authorName: string;
    authorProfileImage: string | null;
    authorShortBio: string;
    content: string;
    mediaUrl: string | null;
    createdAt: string;
    updatedAt: string;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
    isFollowingAuthor: boolean;
}

export interface PostsResponse {
    posts: Post[];
    nextCursor?: number;
    hasMore: boolean;
}

export interface Comment {
    commentId: number;
    postIdx: number;
    userId: number;
    userName: string;
    userProfileImage: string | null;
    content: string;
    createdAt: string;
}

export interface CommentsResponse {
    success: boolean;
    comments: Comment[];
    totalCount: number;
}

export interface CreateCommentResponse {
    success: boolean;
    message: string;
    commentId: number;
}

export interface FollowResponse {
    success: boolean;
    message: string;
    isFollowing: boolean;
}

export interface LikeResponse {
    success: boolean;
    message: string;
    isLiked: boolean;
    likeCount: number;
}

export interface DeleteResponse {
    success: boolean;
    message: string;
}

// ===== API 서비스 클래스 =====
export class SocialApi {
    /**
     * 사용자 소셜 프로필 정보를 가져오는 API
     */
    static async getProfile(userId: string): Promise<SocialProfile> {
        const response = await api.get<SocialProfile>(`/social/profile/${userId}`);
        return response.data;
    }

    /**
     * 사용자 소셜 프로필 정보를 업데이트하는 API
     */
    static async updateProfile(
        userId: string,
        profileData: Partial<SocialProfile>,
    ): Promise<SocialProfile> {
        const response = await api.patch<SocialProfile>(`/social/profile/${userId}`, profileData);
        return response.data;
    }

    /**
     * 팔로우 토글 API
     */
    static async toggleFollow(followerId: number, followingId: number): Promise<FollowResponse> {
        const response = await api.post('/social/follow', {
            followerId,
            followingId,
        });
        return response.data;
    }

    /**
     * 포스트 목록 조회 (무한스크롤)
     */
    static async getPosts(
        currentUserId: number,
        limit: number = 5,
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
            const url = `/social/posts?${params.toString()}`;
            console.log('🔗 API 요청 URL:', url);
            console.log('📋 요청 파라미터:', { currentUserId, limit, cursor });

            const response = await api.get<PostsResponse>(url);
            return response.data;
        } catch (error: any) {
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }

    /**
     * 포스트 좋아요/취소 토글 API
     */
    static async togglePostLike(postId: number, userId: number): Promise<LikeResponse> {
        const response = await api.post(`/social/posts/${postId}/like`, {
            userId,
        });
        return response.data;
    }

    /**
     * 새 포스트 작성
     */
    static async createPost(userId: number, content: string, imageFile?: File): Promise<Post> {
        const formData = new FormData();
        formData.append('userId', userId.toString());
        formData.append('content', content);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        const response = await api.post<Post>('/social/posts', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    /**
     * 댓글 목록 조회
     */
    static async getComments(postId: number): Promise<CommentsResponse> {
        const response = await api.get<CommentsResponse>(`/social/posts/${postId}/comments`);
        return response.data;
    }

    /**
     * 댓글 추가
     */
    static async createComment(
        postId: number,
        userId: number,
        content: string,
    ): Promise<CreateCommentResponse> {
        const response = await api.post<CreateCommentResponse>(`/social/posts/${postId}/comments`, {
            userId,
            content,
        });
        return response.data;
    }

    /**
     * 댓글 삭제
     */
    static async deleteComment(commentId: number, userId: number): Promise<DeleteResponse> {
        const response = await api.post(`/social/comments/${commentId}/delete`, {
            commentId,
            userId,
        });
        return response.data;
    }

    /**
     * 포스트 삭제
     */
    static async deletePost(postId: number, userId: number): Promise<DeleteResponse> {
        const response = await api.delete(`/social/posts/${postId}`, {
            data: { userId },
        });
        return response.data;
    }
}
