'use client';

import { UserOutlined, VideoCameraOutlined, BulbOutlined } from '@ant-design/icons';
import AiInterviewInfoCard from './AiInterviewInfoCard';

export default function AiInterviewInfoSection() {
    const aiInterviewData = {
        main: {
            title: 'AI 모의면접이란?',
            description: '나의 면접 실력을 파악하고 활용할 수 있는 AI 면접이에요.',
            score: 85,
            features: [
                '이력서 기반 맞춤형 질문 생성',
                '원하는 채용공고 선택',
                '실시간 표정 및 음성 분석',
                '종합적인 면접 결과 분석',
            ],
            icon: <UserOutlined />,
        },
        features: [
            {
                title: '실시간 분석',
                description: '웹캠을 통한 즉시 피드백',
                score: 92,
                features: ['표정 분석', '자세 체크', '음성 톤 분석', '실시간 피드백'],
                icon: <VideoCameraOutlined />,
            },
            {
                title: '맞춤 질문',
                description: '개인별 이력서 기반 질문',
                score: 88,
                features: ['이력서 분석', '채용공고 매칭', '난이도 조절', '질문 난이도 자동 조절'],
                icon: <BulbOutlined />,
            },
        ],
    };

    return (
        <div className='flex-shrink-0 pb-8'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 justify-center'>
                <div className='w-full'>
                    <AiInterviewInfoCard {...aiInterviewData.main} />
                </div>
                <div className='w-full'>
                    <AiInterviewInfoCard {...aiInterviewData.features[0]} />
                </div>
                <div className='w-full'>
                    <AiInterviewInfoCard {...aiInterviewData.features[1]} />
                </div>
            </div>
        </div>
    );
}
