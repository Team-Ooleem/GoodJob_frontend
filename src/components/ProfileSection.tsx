'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { User, Users, Star, Building2, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMyProfile } from '@/app/(platform)/social/_hooks';
import { useAuth } from '@/hooks/use-auth';

export default function ProfileSection() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();

    // 내 프로필 클릭 핸들러
    const handleMyProfileClick = () => {
        if (user?.idx) {
            router.push(`/social/profile/${user.idx}`);
        }
    };

    // 내 프로필 데이터 가져오기
    const { data: profile, isLoading: profileLoading, error: profileError } = useMyProfile();

    // 로딩 상태 처리
    if (authLoading || profileLoading) {
        return (
            <div className='w-80 flex-shrink-0'>
                <Card className='text-center'>
                    <CardContent className='flex justify-center items-center h-64'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 에러 상태 처리
    if (profileError) {
        return (
            <div className='w-80 flex-shrink-0'>
                <Card className='text-center'>
                    <CardContent className='flex flex-col justify-center items-center h-64'>
                        <p className='text-destructive mb-4'>프로필을 불러오는데 실패했습니다.</p>
                        <Button onClick={() => window.location.reload()} variant='outline'>
                            다시 시도
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className='w-80 flex-shrink-0'>
                <Card className='text-center'>
                    <CardContent className='flex justify-center items-center h-64'>
                        <p className='text-muted-foreground'>프로필 정보를 찾을 수 없습니다.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    return (
        <div className='w-80 flex-shrink-0'>
            <Card className='sticky top-16'>
                <CardContent className='text-center p-6'>
                    <Avatar className='h-20 w-20 mx-auto mb-4'>
                        <AvatarImage src={profile?.profileImage} alt={profile?.name || '사용자'} />
                        <AvatarFallback>
                            <User className='h-8 w-8' />
                        </AvatarFallback>
                    </Avatar>

                    <h3
                        className='text-xl font-semibold mb-2 cursor-pointer hover:text-primary transition-colors'
                        onClick={handleMyProfileClick}
                    >
                        {profile?.name || '사용자'}
                    </h3>

                    {profile?.bio && (
                        <p className='text-muted-foreground text-sm mb-3'>{profile.bio}</p>
                    )}

                    {/* 멘토 정보 */}
                    {profile?.isMentor && profile?.mentorProfile && (
                        <>
                            <Separator className='my-4' />
                            <div>
                                <div className='text-left space-y-1'>
                                    <div className='flex items-center gap-2 text-sm'>
                                        <Building2 className='h-3 w-3 text-muted-foreground' />
                                        <span>
                                            {profile.mentorProfile?.businessName || '회사명 없음'}
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-2 text-sm'>
                                        <Briefcase className='h-3 w-3 text-muted-foreground' />
                                        <span>
                                            {profile.mentorProfile?.preferredField || '분야 없음'}
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-2 text-sm'>
                                        <Star className='h-3 w-3 text-yellow-500 dark:text-yellow-400' />
                                        <span>
                                            {profile.mentorProfile?.avgMentoringRating?.toFixed(
                                                1,
                                            ) || '0.0'}
                                        </span>
                                        <span className='text-muted-foreground'>
                                            ({profile.mentorProfile?.totalMentoringReviews || 0}개
                                            리뷰)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <Separator className='my-4' />

                    {/* 소셜 통계 */}
                    <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2 text-muted-foreground'>
                                <Users className='h-4 w-4' />
                                <span className='text-sm'>팔로워</span>
                            </div>
                            <span className='font-semibold'>{profile?.followerCount ?? 0}명</span>
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2 text-muted-foreground'>
                                <Users className='h-4 w-4' />
                                <span className='text-sm'>팔로잉</span>
                            </div>
                            <span className='font-semibold'>{profile?.followingCount ?? 0}명</span>
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2 text-muted-foreground'>
                                <span className='text-sm'>게시글</span>
                            </div>
                            <span className='font-semibold'>{profile?.totalPosts ?? 0}개</span>
                        </div>

                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2 text-muted-foreground'>
                                <span className='text-sm'>받은 좋아요</span>
                            </div>
                            <span className='font-semibold'>{profile?.totalLikes ?? 0}개</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
