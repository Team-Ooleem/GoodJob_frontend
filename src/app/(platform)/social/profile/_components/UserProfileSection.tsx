'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Star, Heart, MessageSquare, Loader2 } from 'lucide-react';
import { useUserProfile } from '../_hooks/useUserProfile';
import { useFollowMutations } from '../../_hooks/useFollowMutations';
import { useChatStore } from '@/stores/chat-store';
import { ChatUser } from '@/types/chat';

interface UserProfileSectionProps {
    userId: number;
    currentUserId: number;
}

export function UserProfileSection({ userId, currentUserId }: UserProfileSectionProps) {
    // 사용자 프로필 데이터 조회
    const { data: userProfile, isLoading, error } = useUserProfile(userId);

    // 팔로우 관련 뮤테이션
    const { toggleFollow } = useFollowMutations(currentUserId);

    // 채팅 스토어
    const { startChatWithUser } = useChatStore();

    // 메시지 보내기 핸들러
    const handleSendMessage = () => {
        if (!userProfile || !currentUserId) return;

        // ChatUser 타입으로 변환
        const chatUser: ChatUser = {
            user_id: userProfile.userIdx,
            name: userProfile.name,
            email: '', // UserProfileResponse에는 email이 없음
            short_bio: userProfile.bio || '',
            profile_img: userProfile.profileImage || '',
            job_info: '', // UserProfileResponse에는 jobInfo가 없음
        };

        // 채팅 시작
        startChatWithUser(chatUser, currentUserId);
    };

    // 로딩 상태
    if (isLoading) {
        return (
            <div className='sticky top-16 p-6 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
                <p className='text-muted-foreground mt-4'>프로필을 불러오는 중...</p>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className='sticky top-16 p-6 text-center'>
                <p className='text-destructive mb-4'>프로필을 불러오는데 실패했습니다.</p>
                <Button onClick={() => window.location.reload()} variant='outline'>
                    다시 시도
                </Button>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className='sticky top-16 p-6 text-center'>
                <p className='text-muted-foreground'>사용자를 찾을 수 없습니다.</p>
            </div>
        );
    }

    const isOwnProfile = userId === currentUserId;

    return (
        <div className='sticky top-16 p-6'>
            {/* 프로필 헤더 */}
            <div className='text-center mb-6'>
                <Avatar className='h-24 w-24 mx-auto mb-4'>
                    <AvatarImage src={userProfile?.profileImage} alt={userProfile?.name || ''} />
                    <AvatarFallback>
                        <User className='h-12 w-12' />
                    </AvatarFallback>
                </Avatar>

                <h1 className='text-2xl font-bold mb-2'>
                    {userProfile?.isMentor && userProfile?.mentorProfile?.businessName
                        ? userProfile.mentorProfile.businessName
                        : userProfile?.name}
                </h1>

                {userProfile?.bio && (
                    <p className='text-muted-foreground text-sm mb-4'>{userProfile.bio}</p>
                )}

                {/* 멘토 정보 */}
                {userProfile?.isMentor && userProfile?.mentorProfile && (
                    <>
                        <div className='mb-6'>
                            <div className='space-y-3'>
                                <div>
                                    <p className='text-sm text-muted-foreground'>
                                        {userProfile?.mentorProfile?.preferredField || ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Separator className='my-6' />

            {/* 소셜 통계 */}
            <div className='space-y-4'>
                <h3 className='hidden'>활동 통계</h3>

                <ul className='grid grid-cols-3 gap-4'>
                    <li className='text-center '>
                        <div className='flex items-center justify-center gap-2 mb-1'>
                            <span className='text-sm text-muted-foreground'>팔로워</span>
                        </div>
                        <p className='text-xl font-bold'>{userProfile?.followerCount || 0}</p>
                    </li>

                    <li className='text-center '>
                        <div className='flex items-center justify-center gap-2 mb-1'>
                            <span className='text-sm text-muted-foreground'>팔로잉</span>
                        </div>
                        <p className='text-xl font-bold'>{userProfile?.followingCount || 0}</p>
                    </li>

                    <li className='text-center '>
                        <div className='flex items-center justify-center gap-2 mb-1'>
                            <span className='text-sm text-muted-foreground'>게시글</span>
                        </div>
                        <p className='text-xl font-bold'>{userProfile?.totalPosts || 0}</p>
                    </li>
                </ul>

                {/* 멘토링 통계 (멘토인 경우) */}
                {userProfile?.isMentor && userProfile?.mentorProfile && (
                    <ul className='grid grid-cols-3 gap-4'>
                        <li className='text-center '>
                            <span className='text-sm text-muted-foreground'>멘토링 세션</span>
                            <p className='text-xl font-bold'>
                                {userProfile?.mentorProfile?.totalMentoringSessions || 0}
                            </p>
                        </li>

                        <li className='text-center '>
                            <span className='text-sm text-muted-foreground'>멘토링 리뷰</span>
                            <p className='text-xl font-bold'>
                                {userProfile?.mentorProfile?.totalMentoringReviews || 0}
                            </p>
                        </li>

                        <li className='text-center '>
                            <span className='text-sm text-muted-foreground'>평점</span>
                            <p className='flex items-center justify-center text-xl font-bold'>
                                <Star className='h-4 w-4 text-yellow-500 fill-yellow-500' />
                                {userProfile?.mentorProfile?.avgMentoringRating
                                    ? userProfile.mentorProfile.avgMentoringRating.toFixed(1)
                                    : '0.0'}
                            </p>
                        </li>
                    </ul>
                )}
            </div>

            {/* 팔로우 버튼과 메시지 보내기 버튼 (내 프로필이 아닌 경우에만 표시) */}
            {!isOwnProfile && (
                <div className='mt-6 space-y-3'>
                    <div className='grid grid-cols-2 gap-3'>
                        <Button
                            onClick={() => toggleFollow.mutate(userId)}
                            variant={userProfile.isFollowing ? 'outline' : 'default'}
                            className='flex items-center gap-2'
                            disabled={toggleFollow.isPending}
                        >
                            {toggleFollow.isPending ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                                <Heart className='h-4 w-4' />
                            )}
                            {toggleFollow.isPending
                                ? '처리 중...'
                                : userProfile.isFollowing
                                  ? '팔로우 취소'
                                  : '팔로우'}
                        </Button>
                        <Button
                            onClick={handleSendMessage}
                            variant='outline'
                            className='flex items-center gap-2'
                        >
                            <MessageSquare className='h-4 w-4' />
                            메시지 보내기
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
