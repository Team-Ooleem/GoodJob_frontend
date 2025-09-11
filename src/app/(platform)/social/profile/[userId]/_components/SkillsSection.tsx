'use client';

import { Card, Typography, Tag } from 'antd';
import { UserProfileInfo } from '../../../_apis/social.api';
import { PROFILE_SECTIONS } from '../_constants/profile.const';

const { Text } = Typography;

interface SkillsSectionProps {
    skills?: UserProfileInfo['skills'];
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
    if (!skills || skills.length === 0) {
        return (
            <Card title={PROFILE_SECTIONS.SKILLS} className='h-fit'>
                <div className='text-center py-4 text-gray-500'>
                    <Text>보유 기술이 없습니다.</Text>
                </div>
            </Card>
        );
    }

    return (
        <Card title={PROFILE_SECTIONS.SKILLS} className='h-fit'>
            <div className='flex flex-wrap gap-2'>
                {skills?.map((skill, index) => (
                    <Tag key={index} color='blue'>
                        {skill}
                    </Tag>
                ))}
            </div>
        </Card>
    );
}
