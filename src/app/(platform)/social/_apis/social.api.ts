import { api } from '@/apis/api';

// ===== API 타입 정의 =====

// 멘토 프로필 정보 (멘토인 경우에만 존재)
export interface MentorProfile {
    businessName: string; // 사업체명
    preferredField: string; // 전문분야
    isApproved: boolean; // 멘토 승인 상태
    totalMentoringSessions: number; // 완료된 멘토링 세션 수
    totalMentoringReviews: number; // 총 리뷰 수
    avgMentoringRating: number; // 평균 평점
    totalMentoringApplications: number; // 총 멘토링 신청 수
    introduction?: string; // 멘토 소개글
    portfolioLink?: string; // 포트폴리오 링크
}

// 내 정보 조회 응답 타입 (기존 호환성 유지)
export interface MyProfileInfo {
    userIdx: number;
    name: string;
    profileImage?: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    totalPosts: number;
    totalLikes: number;
    joinDate: string;
    isMentor: boolean;
    mentorProfile?: MentorProfile;
}

// 사용자 프로필 조회 응답 타입
export interface UserProfileResponse {
    userIdx: number;
    name: string;
    profileImage?: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    totalPosts: number;
    totalLikes: number;
    joinDate: string;
    isMentor: boolean;
    isFollowing: boolean; // 현재 사용자가 팔로우하고 있는지
    mentorProfile?: MentorProfile;
}

// 기존 Post 타입 (호환성 유지)
export interface Post {
    postIdx: number;
    userId: number;
    content: string;
    mediaUrl?: string;
    createdAt: string;
    updatedAt: string;
    authorName: string;
    authorProfileImage?: string | null;
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
     * 내 정보 조회 API
     */
    static async getMyProfile(): Promise<MyProfileInfo> {
        const response = await api.get<MyProfileInfo>('/social/profile/me');
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
