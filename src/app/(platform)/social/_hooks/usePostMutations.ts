import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { SocialApi, Post } from '../_apis/social.api';

/**
 * 포스트 관련 뮤테이션을 관리하는 훅
 */
export const usePostMutations = (currentUserId: number) => {
    const queryClient = useQueryClient();

    // 포스트 생성 뮤테이션
    const createPostMutation = useMutation({
        mutationFn: async (data: { content: string; imageFile?: File }) => {
            return SocialApi.createPost(currentUserId, data.content, data.imageFile);
        },
        onSuccess: () => {
            message.success('포스트가 게시되었습니다!');
            queryClient.invalidateQueries({ queryKey: ['posts', currentUserId] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || '포스트 게시에 실패했습니다.';
            message.error(errorMessage);
        },
    });

    // 포스트 삭제 뮤테이션
    const deletePostMutation = useMutation({
        mutationFn: ({ postId, userId }: { postId: number; userId: number }) =>
            SocialApi.deletePost(postId, userId),
        onSuccess: (data) => {
            message.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['posts', currentUserId] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || '포스트 삭제에 실패했습니다.';
            message.error(errorMessage);
        },
    });

    // 포스트 좋아요 뮤테이션
    const likePostMutation = useMutation({
        mutationFn: (postId: number) => SocialApi.togglePostLike(postId, currentUserId),
        onMutate: async (postId: number) => {
            // 진행 중인 쿼리 취소
            await queryClient.cancelQueries({ queryKey: ['posts', currentUserId] });

            // 이전 데이터 백업
            const previousData = queryClient.getQueryData(['posts', currentUserId]);

            // 낙관적 업데이트
            queryClient.setQueryData(['posts', currentUserId], (old: any) => {
                if (!old) return old;

                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        posts: page.posts.map((post: any) => {
                            if (post.postIdx === postId) {
                                return {
                                    ...post,
                                    isLikedByCurrentUser: !post.isLikedByCurrentUser,
                                    likeCount: post.isLikedByCurrentUser
                                        ? post.likeCount - 1
                                        : post.likeCount + 1,
                                };
                            }
                            return post;
                        }),
                    })),
                };
            });

            return { previousData };
        },
        onSuccess: (data) => {
            message.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['posts', currentUserId] });
        },
        onError: (error: any, postId, context) => {
            // 에러 시 이전 데이터로 롤백
            if (context?.previousData) {
                queryClient.setQueryData(['posts', currentUserId], context.previousData);
            }
            const errorMessage = error?.response?.data?.error || '좋아요 처리에 실패했습니다.';
            message.error(errorMessage);
        },
    });

    return {
        createPost: createPostMutation,
        deletePost: deletePostMutation,
        likePost: likePostMutation,
    };
};
