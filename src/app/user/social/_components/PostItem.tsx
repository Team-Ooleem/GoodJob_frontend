'use client';

import { Avatar, Button, Card, Typography } from 'antd';
import {
    UserOutlined,
    HeartOutlined,
    MessageOutlined,
    LikeOutlined,
    LikeFilled,
    GlobalOutlined,
    CheckOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Post } from '../_apis/social.api';
import {
    useSocialProfile,
    useComments,
    usePostMutations,
    useCommentMutations,
    useFollowMutations,
} from '../_hooks';
import { formatTimeAgo } from '@/utils/utils';
const { Text } = Typography;

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
    const { data: currentUserProfile } = useSocialProfile(currentUserId.toString());

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

    return (
        <Card className='bg-white shadow-sm mb-4'>
            {/* 포스트 헤더 */}
            <div className='flex items-start justify-between mb-4'>
                <div className='flex gap-2 items-start space-x-3'>
                    <Avatar
                        size={48}
                        src={post?.author?.profileImage || post?.authorProfileImage}
                        icon={<UserOutlined />}
                    />
                    <div className='flex-1'>
                        <div className='flex items-center space-x-2 mb-1'>
                            <Text
                                strong
                                className='text-base cursor-pointer hover:text-blue-600 transition-colors'
                                onClick={() => handleUserNameClick(post.userId)}
                            >
                                {post?.author?.name || post?.authorName || '익명 사용자'}
                            </Text>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Text type='secondary' className='text-sm'>
                                {formatTimeAgo(post?.createdAt)}
                            </Text>
                            <GlobalOutlined className='text-gray-400 text-sm' />
                        </div>
                    </div>
                </div>
                {isOwnPost ? (
                    <div className='flex gap-2'>
                        <Button type='default' size='small' disabled className='text-gray-500'>
                            내가 쓴 글
                        </Button>
                        <Button
                            type='text'
                            size='small'
                            icon={<DeleteOutlined />}
                            className='!text-red-600 !border-red-200 !bg-red-50 hover:!text-red-700 hover:!bg-red-100 hover:!border-red-300 !shadow-sm'
                            onClick={handleDeletePost}
                            loading={deletePost.isPending}
                        >
                            삭제
                        </Button>
                    </div>
                ) : post?.isFollowingAuthor || false ? (
                    <Button
                        type='default'
                        size='small'
                        icon={<CheckOutlined />}
                        className='text-green-600 border-green-600 hover:border-green-600'
                        onClick={handleFollowToggle}
                        loading={toggleFollow.isPending}
                    >
                        팔로잉
                    </Button>
                ) : (
                    <Button
                        type='primary'
                        size='small'
                        className='bg-blue-600 border-blue-600'
                        onClick={handleFollowToggle}
                        loading={toggleFollow.isPending}
                    >
                        + 팔로우
                    </Button>
                )}
            </div>

            {/* 포스트 내용 */}
            <div className='mb-4'>
                {post?.mediaUrl && (
                    <div className='mt-3'>
                        <div className='relative w-full max-w-full overflow-hidden rounded-lg bg-gray-100'>
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
                <div className='text-gray-800 leading-relaxed whitespace-pre-wrap'>
                    {post?.content}
                </div>
            </div>

            {/* 포스트 액션 */}
            <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center space-x-2'>
                    {post?.likeCount > 0 && (
                        <>
                            <div className='flex -space-x-1'>
                                <Avatar
                                    size={20}
                                    icon={<LikeFilled />}
                                    className='!bg-gradient-to-r !from-sky-400 !to-blue-500 !text-white !shadow-sm'
                                />
                                <Avatar
                                    size={20}
                                    icon={<HeartOutlined />}
                                    className='!bg-gradient-to-r !from-blue-400 !to-sky-500 !text-white !shadow-sm'
                                />
                            </div>
                            <Text className='!text-sm !font-medium !text-sky-600'>
                                {post?.likeCount}
                            </Text>
                        </>
                    )}
                </div>
                <div className='flex items-center space-x-4'>
                    {post?.commentCount > 0 && (
                        <Text type='secondary' className='text-sm'>
                            댓글 {post?.commentCount}
                        </Text>
                    )}
                </div>
            </div>

            {/* 액션 버튼들 */}
            <div className='flex justify-between mb-4 border-t border-b border-gray-200'>
                <Button
                    icon={
                        post?.isLiked || post?.isLikedByCurrentUser ? (
                            <LikeFilled />
                        ) : (
                            <LikeOutlined />
                        )
                    }
                    type='text'
                    className={`flex-1 font-medium ${
                        post?.isLiked || post?.isLikedByCurrentUser
                            ? '!text-sky-600 !bg-sky-50 hover:!bg-sky-100 !border !border-sky-200'
                            : '!text-gray-600 hover:!text-sky-600 hover:!bg-sky-50'
                    }`}
                    style={{
                        color: post?.isLiked || post?.isLikedByCurrentUser ? '#0284c7' : '#6b7280',
                        backgroundColor:
                            post?.isLiked || post?.isLikedByCurrentUser ? '#f0f9ff' : 'transparent',
                        border:
                            post?.isLiked || post?.isLikedByCurrentUser
                                ? '1px solid #bae6fd'
                                : 'none',
                    }}
                    onClick={handleLikeToggle}
                    loading={likePost.isPending}
                >
                    {post?.isLiked || post?.isLikedByCurrentUser ? '추천됨' : '추천'}
                </Button>
                <Button
                    icon={<MessageOutlined />}
                    type='text'
                    className='flex-1 text-gray-600 hover:text-blue-600'
                    onClick={handleCommentToggle}
                >
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
                                        className='flex gap-2 items-start space-x-3'
                                    >
                                        <Avatar
                                            size={32}
                                            src={comment?.userProfileImage}
                                            icon={<UserOutlined />}
                                        />
                                        <div className='flex-1'>
                                            <div className='flex items-center space-x-2 mb-1'>
                                                <Text
                                                    strong
                                                    className='text-sm cursor-pointer hover:text-blue-600 transition-colors'
                                                    onClick={() =>
                                                        handleUserNameClick(comment?.userId)
                                                    }
                                                >
                                                    {comment?.userName || '익명 사용자'}
                                                </Text>
                                                <Text type='secondary' className='text-xs'>
                                                    {formatTimeAgo(comment?.createdAt)}
                                                </Text>
                                            </div>
                                            <Text className='text-sm text-gray-800'>
                                                {comment?.content}
                                            </Text>
                                        </div>
                                        {comment?.userId === currentUserId && (
                                            <Button
                                                type='text'
                                                size='small'
                                                icon={<DeleteOutlined />}
                                                className='!text-red-500 !border-red-200 !bg-red-50 hover:!text-red-700 hover:!bg-red-100 hover:!border-red-300 !shadow-sm !rounded-full !w-8 !h-8 !p-0 !flex !items-center !justify-center'
                                                onClick={() =>
                                                    handleDeleteComment(
                                                        comment?.commentId,
                                                        comment?.userId,
                                                    )
                                                }
                                                loading={deleteComment.isPending}
                                                title='댓글 삭제'
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 댓글 입력 (본인이 작성한 글이 아닐 때만 표시) */}
                    {!isOwnPost && (
                        <form onSubmit={handleCommentSubmit(onCommentSubmit)}>
                            <div className='flex items-center space-x-3 gap-2'>
                                <Avatar
                                    size={32}
                                    src={currentUserProfile?.profileImage}
                                    icon={<UserOutlined />}
                                />
                                <div className='flex-1'>
                                    <div className='flex items-center bg-gray-100 rounded-full px-4 py-2'>
                                        <input
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
                                            className={`bg-transparent flex-1 outline-none text-sm ${
                                                commentErrors.content ? 'text-red-500' : ''
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
                                            type='primary'
                                            size='small'
                                            onClick={handleCommentSubmit(onCommentSubmit)}
                                            loading={createComment.isPending}
                                            disabled={
                                                !isCommentValid ||
                                                !commentContent.trim() ||
                                                !currentUserId
                                            }
                                            className='ml-2 !bg-sky-600 !border-sky-600 hover:!bg-sky-700 !text-white'
                                        >
                                            등록
                                        </Button>
                                    </div>
                                    {commentErrors.content && (
                                        <p className='text-red-500 text-xs mt-1'>
                                            {commentErrors.content.message as string}
                                        </p>
                                    )}
                                    <div className='flex justify-between items-center mt-1'>
                                        <span
                                            className={`text-xs ${commentContent.length > 450 ? 'text-red-500' : 'text-gray-500'}`}
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
        </Card>
    );
}
