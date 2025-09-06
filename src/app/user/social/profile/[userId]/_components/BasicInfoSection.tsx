'use client';

import { Card, Typography } from 'antd';
import {
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    DollarOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { UserProfileInfo } from '../../../_apis/social.api';
import { PROFILE_SECTIONS } from '../_constants/profile.const';

const { Text } = Typography;

interface BasicInfoSectionProps {
    userInfo?: UserProfileInfo;
}

export default function BasicInfoSection({ userInfo }: BasicInfoSectionProps) {
    if (!userInfo) {
        return (
            <Card title={PROFILE_SECTIONS.BASIC_INFO} className='h-fit'>
                <div className='text-center py-4 text-gray-500'>
                    <Text>기본 정보가 없습니다.</Text>
                </div>
            </Card>
        );
    }

    return (
        <Card title={PROFILE_SECTIONS.BASIC_INFO} className='h-fit'>
            <div className='space-y-3'>
                {/* 소개 */}
                {userInfo?.shortBio && (
                    <div>
                        <Text strong className='text-sm text-gray-500'>
                            소개
                        </Text>
                        <Text className='block mt-1'>{userInfo?.shortBio}</Text>
                    </div>
                )}

                {/* 상세 소개 */}
                {userInfo?.bio && (
                    <div>
                        <Text strong className='text-sm text-gray-500'>
                            상세 소개
                        </Text>
                        <Text className='block mt-1'>{userInfo?.bio}</Text>
                    </div>
                )}

                {/* 연락처 */}
                {(userInfo?.phone || userInfo?.email) && (
                    <div>
                        <Text strong className='text-sm text-gray-500'>
                            연락처
                        </Text>
                        <div className='mt-1 space-y-1'>
                            {userInfo?.phone && (
                                <div className='flex items-center space-x-2'>
                                    <PhoneOutlined className='text-gray-400' />
                                    <Text className='text-sm'>{userInfo?.phone}</Text>
                                </div>
                            )}
                            {userInfo?.email && (
                                <div className='flex items-center space-x-2'>
                                    <MailOutlined className='text-gray-400' />
                                    <Text className='text-sm'>{userInfo?.email}</Text>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 희망 직무 */}
                {(userInfo?.desiredJobTitle ||
                    userInfo?.desiredLocation ||
                    userInfo?.desiredSalary) && (
                    <div>
                        <Text strong className='text-sm text-gray-500'>
                            희망 직무
                        </Text>
                        <div className='mt-1 space-y-1'>
                            {userInfo?.desiredJobTitle && (
                                <div className='flex items-center space-x-2'>
                                    <RiseOutlined className='text-gray-400' />
                                    <Text className='text-sm' strong>
                                        {userInfo?.desiredJobTitle}
                                    </Text>
                                </div>
                            )}
                            {userInfo?.desiredLocation && (
                                <div className='flex items-center space-x-2'>
                                    <EnvironmentOutlined className='text-gray-400' />
                                    <Text className='text-sm'>{userInfo.desiredLocation}</Text>
                                </div>
                            )}
                            {userInfo?.desiredSalary && (
                                <div className='flex items-center space-x-2'>
                                    <DollarOutlined className='text-gray-400' />
                                    <Text className='text-sm'>{userInfo?.desiredSalary}</Text>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
