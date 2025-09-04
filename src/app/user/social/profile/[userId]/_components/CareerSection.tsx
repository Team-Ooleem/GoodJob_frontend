'use client';

import { Card, Typography, Tag, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { UserProfileInfo } from '../../../_apis/social.api';
import { formatKoreanDate } from '@/utils/utils';
import { PROFILE_SECTIONS } from '../_constants/profile.const';

const { Text } = Typography;

interface CareerSectionProps {
    careers?: UserProfileInfo['careers'];
}

export default function CareerSection({ careers }: CareerSectionProps) {
    if (!careers || careers.length === 0) {
        return (
            <Card title={PROFILE_SECTIONS.CAREER} className='h-fit'>
                <div className='text-center py-4 text-gray-500'>
                    <Text>경력 정보가 없습니다.</Text>
                </div>
            </Card>
        );
    }

    return (
        <Card title={PROFILE_SECTIONS.CAREER} className='h-fit'>
            <Space direction='vertical' className='w-full'>
                {careers.map((career, index) => (
                    <div
                        key={index}
                        className='space-y-2 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0'
                    >
                        <div>
                            <Text strong className='text-lg'>
                                {career?.companyName}
                            </Text>
                            {career?.companyType && (
                                <Tag className='ml-2'>{career?.companyType}</Tag>
                            )}
                        </div>
                        <div>
                            <Text>{career?.position}</Text>
                            {career?.department && (
                                <Text className='text-gray-500'> · {career?.department}</Text>
                            )}
                        </div>
                        <div className='flex items-center space-x-2 text-sm text-gray-500'>
                            <CalendarOutlined />
                            <Text>
                                {formatKoreanDate(career?.startDate)} -{' '}
                                {career.isCurrent
                                    ? '현재'
                                    : career?.endDate
                                      ? formatKoreanDate(career?.endDate)
                                      : '현재'}
                            </Text>
                        </div>
                        {career?.description && (
                            <Text className='text-gray-600'>{career?.description}</Text>
                        )}
                    </div>
                ))}
            </Space>
        </Card>
    );
}
