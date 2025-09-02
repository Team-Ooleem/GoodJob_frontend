'use client';

import { Button, Card, Typography, Space, Row, Col } from 'antd';
import {
    RobotOutlined,
    BulbOutlined,
    VideoCameraOutlined,
    MessageOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

export default function AiInterviewPage() {
    const features = [
        {
            icon: <RobotOutlined className='text-4xl text-blue-500' />,
            title: '맞춤형 질문 생성',
            description:
                '내 이력서와 등록 정보 기반으로 AI가 나에게 최적화된 면접 질문을 생성합니다.',
        },
        {
            icon: <VideoCameraOutlined className='text-4xl text-green-500' />,
            title: '실제 면접 경험 제공',
            description:
                '면접과 동일하게 60초 안에 답변하도록 설정하고, 답변에 따라 AI가 자연스럽게 꼬리 질문을 이어갑니다.',
        },
        {
            icon: <MessageOutlined className='text-4xl text-purple-500' />,
            title: '면접 실시간 피드백',
            description:
                '면접 진행 중 AI가 영상과 음성을 분석하여, 더 좋은 인상과 답변을 만들 수 있도록 실시간 조언을 제공합니다.',
        },
        {
            icon: <BulbOutlined className='text-4xl text-orange-500' />,
            title: '답변 개선 가이드',
            description:
                '나에게 꼭 맞는 질문과 답변을 기반으로, AI가 더 효과적인 답변 전략과 표현 방법을 제시합니다.',
        },
    ];

    const benefits = [
        '실제 면접 환경과 동일한 경험',
        'AI 기반 맞춤형 질문 생성',
        '실시간 피드백 및 개선 조언',
        '언제든지 반복 연습 가능',
    ];

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
            {/* Hero Section */}
            <div className='container mx-auto px-4 py-16'>
                <Row justify='center' align='middle' className='min-h-[60vh]'>
                    <Col xs={24} lg={16} className='text-center'>
                        <Space direction='vertical' size='large' className='w-full'>
                            <div>
                                <Title
                                    level={1}
                                    className='!text-5xl !font-bold !text-gray-800 mb-4'
                                >
                                    AI 모의면접으로
                                    <br />
                                    <span className='text-blue-600'>완벽한 면접 준비</span>
                                </Title>
                                <Paragraph className='!text-xl !text-gray-600 max-w-2xl mx-auto'>
                                    나만의 이력서를 바탕으로 AI가 맞춤형 질문을 생성하고, 실시간
                                    피드백을 받으며 면접 실력을 향상시켜보세요.
                                </Paragraph>
                            </div>

                            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
                                <Link href='/ai-interview/select'>
                                    <Button
                                        type='primary'
                                        size='large'
                                        className='!h-12 !px-8 !text-lg !font-semibold'
                                        icon={<ArrowRightOutlined />}
                                    >
                                        모의면접 시작하기
                                    </Button>
                                </Link>
                                <Button size='large' className='!h-12 !px-8 !text-lg'>
                                    더 알아보기
                                </Button>
                            </div>
                        </Space>
                    </Col>
                </Row>
            </div>

            {/* Features Section */}
            <div className='container mx-auto px-4 py-16'>
                <div className='text-center mb-16'>
                    <Title level={2} className='!text-3xl !font-bold !text-gray-800 mb-4'>
                        핵심 기능
                    </Title>
                    <Paragraph className='!text-lg !text-gray-600 max-w-2xl mx-auto'>
                        AI 기술을 활용한 혁신적인 모의면접 경험을 제공합니다
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]}>
                    {features.map((feature, index) => (
                        <Col xs={24} md={12} lg={6} key={index}>
                            <Card
                                className='!h-full !border-0 !shadow-lg hover:!shadow-xl transition-all duration-300'
                                bodyStyle={{ padding: '32px 24px' }}
                            >
                                <Space
                                    direction='vertical'
                                    size='large'
                                    className='w-full text-center'
                                >
                                    <div className='flex justify-center'>{feature.icon}</div>
                                    <div>
                                        <Title
                                            level={4}
                                            className='!text-xl !font-semibold !text-gray-800 mb-3'
                                        >
                                            {feature.title}
                                        </Title>
                                        <Paragraph className='!text-gray-600 !mb-0'>
                                            {feature.description}
                                        </Paragraph>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* Benefits Section */}
            <div className='bg-white py-16'>
                <div className='container mx-auto px-4'>
                    <Row justify='center' align='middle'>
                        <Col xs={24} lg={12} className='text-center lg:text-left'>
                            <Title level={2} className='!text-3xl !font-bold !text-gray-800 mb-6'>
                                왜 AI 모의면접을 선택해야 할까요?
                            </Title>
                            <Space direction='vertical' size='middle' className='w-full'>
                                {benefits.map((benefit, index) => (
                                    <div key={index} className='flex items-center gap-3'>
                                        <CheckCircleOutlined className='text-green-500 text-xl' />
                                        <Text className='!text-lg !text-gray-700'>{benefit}</Text>
                                    </div>
                                ))}
                            </Space>
                        </Col>
                        <Col xs={24} lg={12} className='text-center mt-8 lg:mt-0'>
                            <div className='bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl p-8'>
                                <div className='text-6xl mb-4'>🎯</div>
                                <Title level={3} className='!text-2xl !font-bold !text-gray-800'>
                                    면접 성공률 향상
                                </Title>
                                <Paragraph className='!text-lg !text-gray-600'>
                                    체계적인 연습을 통해 실제 면접에서 더 자신감 있게 답변하세요
                                </Paragraph>
                            </div>
                        </Col>
                    </Row>
                </div>
            </div>

            {/* CTA Section */}
            <div className='bg-gradient-to-r from-blue-600 to-indigo-600 py-16'>
                <div className='container mx-auto px-4 text-center'>
                    <Space direction='vertical' size='large' className='w-full'>
                        <Title level={2} className='!text-3xl !font-bold !text-white mb-4'>
                            지금 바로 시작해보세요
                        </Title>
                        <Paragraph className='!text-xl !text-blue-100 max-w-2xl mx-auto'>
                            AI 모의면접으로 면접 실력을 한 단계 업그레이드하고, 꿈의 회사 합격에 한
                            걸음 더 가까워지세요.
                        </Paragraph>
                        <Link href='/ai-interview/select'>
                            <Button
                                type='primary'
                                size='large'
                                className='!h-14 !px-12 !text-xl !font-bold !bg-white !text-blue-600 hover:!bg-gray-50'
                                icon={<ArrowRightOutlined />}
                            >
                                무료로 모의면접 시작하기
                            </Button>
                        </Link>
                    </Space>
                </div>
            </div>
        </div>
    );
}
