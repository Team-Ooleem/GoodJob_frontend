'use client';

import { Card, Typography } from 'antd';
import {
    CheckCircleOutlined,
    VideoCameraOutlined,
    BulbOutlined,
    UserOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface AiInterviewInfoCardProps {
    title: string;
    description: string;
    score?: number;
    features?: string[];
    icon?: React.ReactNode;
}

export default function AiInterviewInfoCard({
    title,
    description,
    score = 85,
    features = [],
    icon = <CheckCircleOutlined />,
}: AiInterviewInfoCardProps) {
    return (
        <div className='relative'>
            {/* 3D 레이어 효과를 위한 배경 카드들 */}
            <div className='absolute top-2 left-2 w-full h-full bg-white/60 rounded-2xl blur-sm'></div>
            <div className='absolute top-1 left-1 w-full h-full bg-white/40 rounded-2xl blur-sm'></div>

            {/* 메인 카드 */}
            <Card className='relative bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden h-full flex flex-col'>
                <div className='p-5 flex flex-col h-full'>
                    {/* 상단 아이콘과 제목 */}
                    <div className='flex items-start justify-between mb-4'>
                        <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg'>
                                <div className='text-white text-lg'>{icon}</div>
                            </div>
                            <div>
                                <Title
                                    level={4}
                                    className='!mb-1 !text-lg !font-bold !text-gray-800'
                                >
                                    {title}
                                </Title>
                                <Paragraph className='!mb-0 !text-gray-600 !text-sm'>
                                    {description}
                                </Paragraph>
                            </div>
                        </div>
                    </div>

                    {/* 점수와 프로그레스 바 */}
                    {score && (
                        <div className='mb-4'>
                            <div className='flex items-center justify-between mb-2'>
                                <span className='text-2xl font-bold text-blue-600'>{score}%</span>
                                <div className='text-xs text-gray-500 font-medium'>
                                    AI 면접 적합도
                                </div>
                            </div>
                            <div className='relative'>
                                <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                                    <div
                                        className='h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-1000 ease-out'
                                        style={{ width: `${score}%` }}
                                    ></div>
                                </div>
                                <div
                                    className='absolute top-0 w-3 h-3 bg-blue-600 rounded-full shadow-lg transform -translate-y-0.5 transition-all duration-1000 ease-out'
                                    style={{ left: `calc(${score}% - 6px)` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* 기능 특징들 */}
                    {features.length > 0 && (
                        <div className='space-y-2 flex-1'>
                            {features.map((feature, index) => (
                                <div key={index} className='flex items-center space-x-2'>
                                    <div className='w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0'></div>
                                    <span className='text-xs text-gray-700'>{feature}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 3D 요소들 */}
                    <div className='absolute top-3 right-3 opacity-20'>
                        <div className='w-12 h-8 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-lg transform rotate-12'></div>
                    </div>
                    <div className='absolute bottom-3 right-6 opacity-30'>
                        <div className='w-8 h-8 bg-gradient-to-br from-green-300 to-blue-400 rounded-lg flex items-center justify-center transform -rotate-12'>
                            <VideoCameraOutlined className='text-white text-sm' />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// AI 면접 정보를 위한 기본 데이터
export const aiInterviewData = {
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
