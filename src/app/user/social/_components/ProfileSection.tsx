'use client';

import { Avatar, Card, Typography, Divider, Spin, Button } from 'antd';
import { UserOutlined, EnvironmentOutlined, TeamOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useSocialProfile } from '../_hooks';

const { Text, Title } = Typography;

export default function ProfileSection() {
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // localStorage에서 user_idx 가져오기
    useEffect(() => {
        const userId = localStorage.getItem('user_idx');
        if (userId) {
            setCurrentUserId(userId);
        }
    }, []);

    // 사용자 프로필 데이터 가져오기
    const {
        data: profile,
        isLoading: profileLoading,
        error: profileError,
    } = useSocialProfile(currentUserId);

    // 로딩 상태 처리
    if (profileLoading) {
        return (
            <div className='w-80 flex-shrink-0'>
                <Card className='text-center'>
                    <div className='flex justify-center items-center h-64'>
                        <Spin size='large' />
                    </div>
                </Card>
            </div>
        );
    }

    // 에러 상태 처리
    if (profileError) {
        return (
            <div className='w-80 flex-shrink-0'>
                <Card className='text-center'>
                    <div className='flex flex-col justify-center items-center h-64'>
                        <Text type='danger'>프로필을 불러오는데 실패했습니다.</Text>
                        <Button onClick={() => window.location.reload()} className='mt-2'>
                            다시 시도
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className='w-80 flex-shrink-0'>
                <Card className='text-center'>
                    <div className='flex justify-center items-center h-64'>
                        <Text>프로필 정보를 찾을 수 없습니다.</Text>
                    </div>
                </Card>
            </div>
        );
    }
    return (
        <div className='w-80 flex-shrink-0'>
            <Card className='!sticky top-0 text-center'>
                <Avatar
                    size={80}
                    src={profile?.profileImage}
                    icon={<UserOutlined />}
                    className='mb-4'
                />
                <Title level={4} className='mb-2'>
                    {profile?.name || '사용자'}
                </Title>
                <Text className='text-gray-600 block mb-1'>
                    {profile?.jobTitle || '직책 정보 없음'}
                </Text>
                <Text className='text-gray-500 block mb-3'>
                    <EnvironmentOutlined className='mr-1' />
                    {profile?.residence || '위치 정보 없음'}
                </Text>

                <Divider />

                <div className='text-left space-y-3'>
                    <div className='flex items-center justify-between'>
                        <Text className='text-gray-600'>
                            <TeamOutlined className='mr-2' />
                            팔로워
                        </Text>
                        <Text strong>{profile?.followerCount || 0}명</Text>
                    </div>
                </div>
            </Card>
        </div>
    );
}
