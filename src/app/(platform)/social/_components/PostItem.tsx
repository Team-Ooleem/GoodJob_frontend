'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User, Heart, MessageCircle, ThumbsUp, Globe, Check, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Post } from '../_apis/social.api';
import {
    useMyProfile,
    useComments,
    usePostMutations,
    useCommentMutations,
    useFollowMutations,
} from '../_hooks';
import { formatTimeAgo } from '@/utils/utils';

interface PostItemProps {
    post: Post;
    currentUserId: number;
    onPostDeleted?: () => void;
    onPostUpdated?: () => void;
}

export default function PostItem({
    post,
    currentUserId,
    onPostDeleted,
    onPostUpdated,
}: PostItemProps) {
    const router = useRouter();
    const [isCommentOpen, setIsCommentOpen] = useState(false);

    // 댓글 입력을 위한 현재 사용자 프로필 조회
    const { data: currentUserProfile } = useMyProfile();

    // 댓글 목록 조회 (댓글 창이 열렸을 때만)
    const { data: commentsData } = useComments(post.postIdx, isCommentOpen);

    // 뮤테이션 훅들
    const { likePost, deletePost } = usePostMutations(currentUserId);
    const { createComment, deleteComment } = useCommentMutations(currentUserId);
    const { toggleFollow } = useFollowMutations(currentUserId);

    // 댓글 React Hook Form 설정
    const {
        register: registerComment,
        handleSubmit: handleCommentSubmit,
        formState: { errors: commentErrors, isValid: isCommentValid },
        watch: watchComment,
        reset: resetComment,
    } = useForm({
        mode: 'onChange',
    });

    const commentContent = watchComment('content', '');

    // 이벤트 핸들러들
    const handleLikeToggle = () => {
        likePost.mutate(post.postIdx, {
            onSuccess: () => {
                // 좋아요 성공 시 콜백 호출
                onPostUpdated?.();
            },
        });
    };

    const handleFollowToggle = () => {
        toggleFollow.mutate(post.userId);
    };

    // 댓글 제출 핸들러
    const onCommentSubmit = (data: any) => {
        createComment.mutate(
            {
                postId: post.postIdx,
                content: data.content,
            },
            {
                onSuccess: () => {
                    // 댓글 작성 성공 시 콜백 호출
                    onPostUpdated?.();
                    resetComment();
                },
            },
        );
    };

    // 댓글 삭제 핸들러
    const handleDeleteComment = (commentId: number, userId: number) => {
        deleteComment.mutate(
            { commentId, userId },
            {
                onSuccess: () => {
                    // 댓글 삭제 성공 시 콜백 호출
                    onPostUpdated?.();
                },
            },
        );
    };

    // 포스트 삭제 핸들러
    const handleDeletePost = () => {
        deletePost.mutate(
            { postId: post.postIdx, userId: currentUserId },
            {
                onSuccess: () => {
                    // 포스트 삭제 성공 시 콜백 호출
                    onPostDeleted?.();
                },
            },
        );
    };

    // 댓글 창 토글 핸들러
    const handleCommentToggle = () => {
        setIsCommentOpen(!isCommentOpen);
    };

    // 사용자 이름 클릭 핸들러
    const handleUserNameClick = (userId: number) => {
        router.push(`/user/social/profile/${userId}`);
    };

    // 본인이 작성한 글인지 확인
    const isOwnPost = post?.userId === currentUserId;

    // 디버깅을 위한 로그 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
        console.log('PostItem Debug:', {
            postIdx: post?.postIdx,
            userId: post?.userId,
            authorName: post?.authorName,
            authorProfileImage: post?.authorProfileImage,
            isLikedByCurrentUser: post?.isLikedByCurrentUser,
            likeCount: post?.likeCount,
        });
    }

    return (
        <Card className='mb-4'>
            <CardContent className='p-6'>
                {/* 포스트 헤더 */}
                <div className='flex items-start justify-between mb-4'>
                    <div className='flex gap-3 items-start'>
                        <Avatar className='h-12 w-12'>
                            <AvatarImage
                                src={post?.authorProfileImage || undefined}
                                alt={post?.authorName || '익명 사용자'}
                            />
                            <AvatarFallback>
                                <User className='h-6 w-6' />
                            </AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                            <div className='flex items-center space-x-2 mb-1'>
                                <h4
                                    className='text-base font-semibold cursor-pointer hover:text-primary transition-colors'
                                    onClick={() => handleUserNameClick(post.userId)}
                                >
                                    {post?.authorName || '익명 사용자'}
                                </h4>
                            </div>
                            <div className='flex items-center space-x-2'>
                                <p className='text-sm text-muted-foreground'>
                                    {formatTimeAgo(post?.createdAt)}
                                </p>
                                <Globe className='h-3 w-3 text-muted-foreground' />
                            </div>
                        </div>
                    </div>
                    {isOwnPost ? (
                        <div className='flex gap-2'>
                            <Badge variant='secondary' className='text-xs'>
                                내가 쓴 글
                            </Badge>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={handleDeletePost}
                                disabled={deletePost.isPending}
                                className='text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground'
                            >
                                {deletePost.isPending ? (
                                    <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1'></div>
                                ) : (
                                    <Trash2 className='h-3 w-3 mr-1' />
                                )}
                                삭제
                            </Button>
                        </div>
                    ) : false ? (
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={handleFollowToggle}
                            disabled={toggleFollow.isPending}
                            className='text-green-600 border-green-600 hover:bg-green-50'
                        >
                            {toggleFollow.isPending ? (
                                <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1'></div>
                            ) : (
                                <Check className='h-3 w-3 mr-1' />
                            )}
                            팔로잉
                        </Button>
                    ) : (
                        <Button
                            size='sm'
                            onClick={handleFollowToggle}
                            disabled={toggleFollow.isPending}
                        >
                            {toggleFollow.isPending ? (
                                <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1'></div>
                            ) : null}
                            + 팔로우
                        </Button>
                    )}
                </div>

                {/* 포스트 내용 */}
                <div className='mb-4'>
                    {post?.mediaUrl && (
                        <div className='mt-3'>
                            <div className='relative w-full max-w-full overflow-hidden rounded-lg bg-muted'>
                                <Image
                                    src={post?.mediaUrl}
                                    alt='포스트 미디어'
                                    width={800}
                                    height={600}
                                    className='w-full h-auto object-contain'
                                    style={{ aspectRatio: '4/3' }}
                                    priority={false}
                                    placeholder='blur'
                                    blurDataURL='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
                                />
                            </div>
                        </div>
                    )}
                    <div className='text-foreground leading-relaxed whitespace-pre-wrap'>
                        {post?.content}
                    </div>
                </div>

                {/* 포스트 액션 */}
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center space-x-2'>
                        {post?.likeCount > 0 && (
                            <>
                                <div className='flex -space-x-1'>
                                    <div className='h-5 w-5 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 flex items-center justify-center text-white text-xs shadow-sm'>
                                        <ThumbsUp className='h-3 w-3' />
                                    </div>
                                    <div className='h-5 w-5 rounded-full bg-gradient-to-r from-blue-400 to-sky-500 flex items-center justify-center text-white text-xs shadow-sm'>
                                        <Heart className='h-3 w-3' />
                                    </div>
                                </div>
                                <p className='text-sm font-medium text-sky-600'>
                                    {post?.likeCount}
                                </p>
                            </>
                        )}
                        {post?.isLikedByCurrentUser && post?.likeCount === 0 && (
                            <p className='text-sm font-medium text-sky-600'>추천됨</p>
                        )}
                    </div>
                    <div className='flex items-center space-x-4'>
                        {post?.commentCount > 0 && (
                            <p className='text-sm text-muted-foreground'>
                                댓글 {post?.commentCount}
                            </p>
                        )}
                    </div>
                </div>

                {/* 액션 버튼들 */}
                <div className='flex justify-between mb-4 border-t border-b'>
                    <Button
                        variant={post?.isLikedByCurrentUser ? 'default' : 'ghost'}
                        className={`flex-1 font-medium ${
                            post?.isLikedByCurrentUser
                                ? 'text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200'
                                : 'text-muted-foreground hover:text-sky-600 hover:bg-sky-50'
                        }`}
                        onClick={handleLikeToggle}
                        disabled={likePost.isPending}
                    >
                        {likePost.isPending ? (
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2'></div>
                        ) : (
                            <ThumbsUp
                                className={`h-4 w-4 mr-2 ${post?.isLikedByCurrentUser ? 'text-sky-600' : ''}`}
                            />
                        )}
                        {post?.isLikedByCurrentUser ? '추천됨' : '추천'}
                    </Button>
                    <Button
                        variant='ghost'
                        className='flex-1 text-muted-foreground hover:text-primary'
                        onClick={handleCommentToggle}
                    >
                        <MessageCircle className='h-4 w-4 mr-2' />
                        댓글
                    </Button>
                </div>

                {/* 댓글 목록 및 입력창 (댓글 창이 열렸을 때만 표시) */}
                {isCommentOpen && (
                    <>
                        {/* 댓글 목록 */}
                        {commentsData?.comments && commentsData.comments.length > 0 && (
                            <div className='mb-4 space-y-3'>
                                {commentsData.comments.map((comment) => {
                                    // comment가 undefined이거나 필요한 속성이 없으면 렌더링하지 않음
                                    if (!comment || !comment.commentId || !comment.userId) {
                                        return null;
                                    }

                                    return (
                                        <div
                                            key={comment?.commentId}
                                            className='flex gap-3 items-start'
                                        >
                                            <Avatar className='h-8 w-8'>
                                                <AvatarImage
                                                    src={comment?.userProfileImage || undefined}
                                                    alt={comment?.userName || '익명 사용자'}
                                                />
                                                <AvatarFallback>
                                                    <User className='h-4 w-4' />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className='flex-1'>
                                                <div className='flex items-center space-x-2 mb-1'>
                                                    <h5
                                                        className='text-sm font-semibold cursor-pointer hover:text-primary transition-colors'
                                                        onClick={() =>
                                                            handleUserNameClick(comment?.userId)
                                                        }
                                                    >
                                                        {comment?.userName || '익명 사용자'}
                                                    </h5>
                                                    <p className='text-xs text-muted-foreground'>
                                                        {formatTimeAgo(comment?.createdAt)}
                                                    </p>
                                                </div>
                                                <p className='text-sm text-foreground'>
                                                    {comment?.content}
                                                </p>
                                            </div>
                                            {comment?.userId === currentUserId && (
                                                <Button
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() =>
                                                        handleDeleteComment(
                                                            comment?.commentId,
                                                            comment?.userId,
                                                        )
                                                    }
                                                    disabled={deleteComment.isPending}
                                                    className='text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full w-8 h-8 p-0'
                                                    title='댓글 삭제'
                                                >
                                                    {deleteComment.isPending ? (
                                                        <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-current'></div>
                                                    ) : (
                                                        <Trash2 className='h-3 w-3' />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* 댓글 입력 (본인이 작성한 글이 아닐 때만 표시) */}
                        {!isOwnPost && (
                            <form onSubmit={handleCommentSubmit(onCommentSubmit)}>
                                <div className='flex items-center gap-3'>
                                    <Avatar className='h-8 w-8'>
                                        <AvatarImage
                                            src={currentUserProfile?.profileImage}
                                            alt={currentUserProfile?.name || '사용자'}
                                        />
                                        <AvatarFallback>
                                            <User className='h-4 w-4' />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1'>
                                        <div className='flex items-center bg-muted rounded-full px-4 py-2'>
                                            <Input
                                                {...registerComment('content', {
                                                    required: '댓글을 입력해주세요.',
                                                    minLength: {
                                                        value: 1,
                                                        message: '댓글을 입력해주세요.',
                                                    },
                                                    maxLength: {
                                                        value: 500,
                                                        message: '500자 이하로 입력해주세요.',
                                                    },
                                                })}
                                                placeholder='댓글 남기기 (Enter 또는 등록 버튼)'
                                                className={`bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm ${
                                                    commentErrors.content ? 'text-destructive' : ''
                                                }`}
                                                disabled={createComment.isPending || !currentUserId}
                                                onKeyDown={(
                                                    e: React.KeyboardEvent<HTMLInputElement>,
                                                ) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleCommentSubmit(onCommentSubmit)();
                                                    }
                                                }}
                                            />
                                            <Button
                                                type='submit'
                                                size='sm'
                                                disabled={
                                                    !isCommentValid ||
                                                    !commentContent.trim() ||
                                                    !currentUserId ||
                                                    createComment.isPending
                                                }
                                                className='ml-2'
                                            >
                                                {createComment.isPending ? (
                                                    <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1'></div>
                                                ) : null}
                                                등록
                                            </Button>
                                        </div>
                                        {commentErrors.content && (
                                            <p className='text-destructive text-xs mt-1'>
                                                {commentErrors.content.message as string}
                                            </p>
                                        )}
                                        <div className='flex justify-between items-center mt-1'>
                                            <span
                                                className={`text-xs ${
                                                    commentContent.length > 450
                                                        ? 'text-destructive'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {commentContent.length}/500
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
