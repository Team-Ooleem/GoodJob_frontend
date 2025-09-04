'use client';

import {
    UserProfileHeader,
    UserPostsList,
    BasicInfoSection,
    CareerSection,
    EducationSection,
    SkillsSection,
} from './index';
import { useProfileData } from '../_hooks/useProfileData';
import { Spin, Button, Card, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { PROFILE_SECTIONS } from '../_constants/profile.const';

const { Text } = Typography;

interface UserProfileDetailProps {
    userId: string;
}

export default function UserProfileDetail({ userId }: UserProfileDetailProps) {
    const router = useRouter();

    // 프로필 데이터 관리
    const {
        userInfo,
        posts,
        hasMore,
        nextCursor,
        detailLoading,
        postsLoading,
        postsError,
        handleFollowChange,
        handlePostUpdate,
    } = useProfileData({ userId, postsLimit: 10 });

    return (
        <div className='min-h-screen bg-gray-50'>
            {/* 프로필 헤더 */}
            <div className='bg-white border-b border-gray-200'>
                {detailLoading ? (
                    <div className='text-center py-8'>
                        <Spin size='large' />
                        <p className='mt-4 text-gray-600'>프로필을 불러오는 중...</p>
                    </div>
                ) : (
                    <UserProfileHeader
                        profile={userInfo}
                        targetUserId={userId}
                        onFollowChange={handleFollowChange}
                    />
                )}
            </div>

            {/* 메인 콘텐츠 */}
            <div className='max-w-4xl mx-auto px-4 py-6'>
                <div className='flex flex-col gap-6'>
                    {/* 프로필 섹션들 */}
                    <div className='flex flex-col gap-2'>
                        <BasicInfoSection userInfo={userInfo} />
                        <CareerSection careers={userInfo?.careers} />
                        <EducationSection education={userInfo?.education} />
                        <SkillsSection skills={userInfo?.skills} />
                    </div>

                    {/* 활동 (포스트) */}
                    <div>
                        <Card title={PROFILE_SECTIONS.ACTIVITIES} className='h-fit'>
                            {postsLoading ? (
                                <div className='text-center py-8'>
                                    <Spin size='large' />
                                    <p className='mt-4 text-gray-600'>포스트를 불러오는 중...</p>
                                </div>
                            ) : postsError ? (
                                <div className='text-center py-8 text-red-500'>
                                    <Text>포스트를 불러올 수 없습니다.</Text>
                                </div>
                            ) : posts?.length > 0 ? (
                                <UserPostsList
                                    posts={posts}
                                    hasMore={hasMore}
                                    nextCursor={nextCursor}
                                    targetUserId={userId}
                                    onPostDeleted={handlePostUpdate}
                                    onPostUpdated={handlePostUpdate}
                                />
                            ) : (
                                <div className='text-center py-8 text-gray-500'>
                                    <Text>아직 작성한 포스트가 없습니다.</Text>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
