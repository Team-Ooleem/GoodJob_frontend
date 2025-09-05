'use client';

import { Avatar, Typography, Button, Card } from 'antd';
import {
    UserOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    CheckOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { UserProfileInfo } from '../../../_apis/social.api';
import { useFollowMutations } from '../../../_hooks';
import { useChatStore } from '@/stores/chat-store';
import { ChatUser } from '@/types/chat';
import { useAuth } from '@/hooks';

const { Text, Title } = Typography;

interface UserProfileHeaderProps {
    profile: UserProfileInfo | undefined;
    targetUserId: string;
    onFollowChange?: () => void;
}

export default function UserProfileHeader({
    profile,
    targetUserId,
    onFollowChange,
}: UserProfileHeaderProps) {
    const { user, isAuthenticated } = useAuth();
    const currentUserId = user?.idx || null;
    const { toggleFollow } = useFollowMutations(currentUserId || 0);
    const { startChatWithUser } = useChatStore();

    // 현재 사용자인지 확인
    const isCurrentUserProfile = currentUserId && currentUserId.toString() === targetUserId;

    // 팔로우 상태 확인
    const isFollowing = profile?.isFollowing || false;

    const handleFollowToggle = () => {
        if (currentUserId && !isCurrentUserProfile) {
            toggleFollow.mutate(parseInt(targetUserId), {
                onSuccess: () => {
                    // 팔로우 상태 변경 성공 시 콜백 호출
                    onFollowChange?.();
                },
            });
        }
    };

    const handleSendMessage = () => {
        if (profile && !isCurrentUserProfile) {
            // profile 정보를 ChatUser 형태로 변환
            const chatUser: ChatUser = {
                user_id: parseInt(targetUserId),
                name: profile.name || '사용자',
                email: profile.email || '',
                short_bio: profile.shortBio || '',
                profile_img: profile.profileImage || '',
                job_info:
                    profile.careers && profile.careers.length > 0
                        ? `${profile.careers[0].companyName} · ${profile.careers[0].position}`
                        : '신입',
            };

            // 채팅 시작
            startChatWithUser(chatUser);
        }
    };

    return (
        <div className='max-w-4xl mx-auto px-4 py-4'>
            <Card className='border-0 shadow-none'>
                <div className='flex gap-6 items-center space-x-6'>
                    {/* 아바타 */}
                    <Avatar size={80} src={profile?.profileImage} icon={<UserOutlined />} />

                    {/* 사용자 정보 */}
                    <div className='flex-1'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <Title level={3} className='mb-1'>
                                    {profile?.name || '사용자'}
                                </Title>

                                {/* 현재 역할 정보 */}
                                <Text className='text-gray-600 block'>
                                    {profile?.careers && profile.careers.length > 0
                                        ? `${profile.careers[0].companyName} · ${profile.careers[0].position}`
                                        : '신입'}
                                </Text>

                                {/* 희망 근무지역 */}
                                {profile?.desiredLocation && (
                                    <Text className='text-gray-500 text-sm'>
                                        <EnvironmentOutlined className='mr-1' />
                                        {profile.desiredLocation}
                                    </Text>
                                )}
                            </div>

                            {/* 팔로워/팔로잉 수와 메세지 버튼 */}
                            <div className='flex flex-col items-end space-y-3'>
                                <div className='flex items-center space-x-6'>
                                    <div className='text-center'>
                                        <Text className='text-gray-600 text-sm block'>
                                            <TeamOutlined className='mr-1' />
                                            팔로워
                                        </Text>
                                        <Text strong className='text-lg'>
                                            {profile?.followerCount || 0}명
                                        </Text>
                                    </div>
                                    <div className='text-center'>
                                        <Text className='text-gray-600 text-sm block'>팔로잉</Text>
                                        <Text strong className='text-lg'>
                                            {profile?.followingCount || 0}명
                                        </Text>
                                    </div>
                                </div>

                                {/* 메세지 보내기 버튼 */}
                                {!isCurrentUserProfile && isAuthenticated && (
                                    <Button
                                        type='primary'
                                        className='bg-blue-500 border-blue-500 text-white hover:bg-white hover:border-blue-500 hover:text-blue-500 transition-all duration-200'
                                        icon={<SendOutlined />}
                                        onClick={handleSendMessage}
                                    >
                                        메세지 보내기
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 팔로우 버튼 (본인이 아닌 경우만) */}
                    {!isCurrentUserProfile && isAuthenticated && (
                        <Button
                            type={isFollowing ? 'default' : 'primary'}
                            className={
                                isFollowing
                                    ? 'border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500'
                                    : 'bg-blue-600 border-blue-600'
                            }
                            onClick={handleFollowToggle}
                            loading={toggleFollow.isPending}
                            icon={isFollowing ? <CheckOutlined /> : undefined}
                        >
                            {isFollowing ? '팔로우 중' : '+ 팔로우'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
