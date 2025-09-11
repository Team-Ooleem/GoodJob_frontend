import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { SocialApi } from '../_apis/social.api';

/**
 * 댓글 관련 뮤테이션을 관리하는 훅
 */
export const useCommentMutations = (currentUserId: number) => {
    const queryClient = useQueryClient();

    // 댓글 생성 뮤테이션
    const createCommentMutation = useMutation({
        mutationFn: ({ postId, content }: { postId: number; content: string }) => {
            if (!currentUserId) {
                throw new Error('사용자 ID가 없습니다.');
            }
            return SocialApi.createComment(postId, currentUserId, content);
        },
        onSuccess: (data) => {
            message.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['comments'] });
            queryClient.invalidateQueries({ queryKey: ['posts', currentUserId] });
        },
        onError: (error: any) => {
            const errorMessage =
                error?.response?.data?.error || error?.message || '댓글 등록에 실패했습니다.';
            message.error(errorMessage);
        },
    });

    // 댓글 삭제 뮤테이션
    const deleteCommentMutation = useMutation({
        mutationFn: ({ commentId, userId }: { commentId: number; userId: number }) =>
            SocialApi.deleteComment(commentId, userId),
        onSuccess: (data) => {
            message.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['comments'] });
            queryClient.invalidateQueries({ queryKey: ['posts', currentUserId] });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.error || '댓글 삭제에 실패했습니다.';
            message.error(errorMessage);
        },
    });

    return {
        createComment: createCommentMutation,
        deleteComment: deleteCommentMutation,
    };
};
