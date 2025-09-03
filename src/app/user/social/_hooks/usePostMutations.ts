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
        onSuccess: (data) => {
            message.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['posts', currentUserId] });
        },
        onError: (error: any) => {
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
