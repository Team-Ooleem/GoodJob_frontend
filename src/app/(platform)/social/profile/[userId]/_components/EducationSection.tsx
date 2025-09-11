'use client';

import { Card, Typography, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { UserProfileInfo } from '../../../_apis/social.api';
import { formatKoreanDate } from '@/utils/utils';
import { PROFILE_SECTIONS } from '../_constants/profile.const';

const { Text } = Typography;

interface EducationSectionProps {
    education?: UserProfileInfo['education'];
}

export default function EducationSection({ education }: EducationSectionProps) {
    if (!education || education.length === 0) {
        return (
            <Card title={PROFILE_SECTIONS.EDUCATION} className='h-fit'>
                <div className='text-center py-4 text-gray-500'>
                    <Text>학력 정보가 없습니다.</Text>
                </div>
            </Card>
        );
    }

    return (
        <Card title={PROFILE_SECTIONS.EDUCATION} className='h-fit'>
            <Space direction='vertical' className='w-full'>
                {education.map((edu, index) => (
                    <div
                        key={index}
                        className='space-y-1 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0'
                    >
                        <div>
                            <Text strong>{edu?.schoolName}</Text>
                            <Text className='text-gray-500'> · {edu?.degreeName}</Text>
                        </div>
                        <div>
                            <Text>{edu?.major}</Text>
                        </div>
                        <div className='flex items-center space-x-2 text-sm text-gray-500'>
                            <CalendarOutlined />
                            <Text>
                                {formatKoreanDate(edu?.startDate)} -{' '}
                                {edu?.isCurrent
                                    ? '재학 중'
                                    : edu?.endDate
                                      ? formatKoreanDate(edu?.endDate)
                                      : '재학 중'}
                            </Text>
                        </div>
                    </div>
                ))}
            </Space>
        </Card>
    );
}
