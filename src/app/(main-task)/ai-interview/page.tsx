'use client';

import { Button, Row, Col, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { AiInterviewInfoCard, aiInterviewData } from './_components';

const { Title, Paragraph, Text } = Typography;

export default function AiInterviewPage() {
    return (
        <div className='h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden relative'>
            {/* Glassmorphism Background Elements */}
            <div className='absolute top-0 left-0 w-full h-full'>
                {/* Large cyan circle - top left */}
                <div className='absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-cyan-300/30 to-cyan-500/20 rounded-full blur-3xl'></div>

                {/* Blue circle - center bottom */}
                <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-blue-400/40 to-blue-600/30 rounded-full blur-3xl'></div>

                {/* Green gradient circle - center right */}
                <div className='absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-72 h-72 bg-gradient-to-l from-white/20 via-green-300/30 to-green-500/40 rounded-full blur-3xl'></div>

                {/* Small green circle - top right */}
                <div className='absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-green-400/50 to-green-600/30 rounded-full blur-2xl'></div>

                {/* Additional floating elements */}
                <div className='absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-2xl'></div>
                <div className='absolute bottom-1/4 left-1/4 w-40 h-40 bg-gradient-to-tr from-yellow-300/20 to-orange-400/20 rounded-full blur-2xl'></div>
            </div>

            <div className='container mx-auto px-4 h-full relative z-10 flex flex-col'>
                {/* 상단 메인 섹션 */}
                <div className='flex-1 flex flex-col justify-center'>
                    {/* 메인 타이틀과 설명 */}
                    <div className='text-center mb-8'>
                        <div className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-medium mb-6 shadow-lg'>
                            🚀 베타 버전 - 지금 무료로 체험해보세요
                        </div>

                        <Title
                            level={1}
                            className='!text-4xl lg:!text-5xl !font-bold !text-gray-900 mb-4 !leading-tight'
                        >
                            <img
                                src='/assets/good-job-logo.webp'
                                alt='Good Job Logo'
                                className='inline-block h-12 w-auto mr-3 align-middle'
                            />
                            면접, 이제 AI와 함께
                            <span className='text-blue-600'> 실전처럼 연습하세요</span>
                        </Title>

                        <Paragraph className='!text-lg !text-gray-700 !leading-relaxed mb-8 max-w-4xl mx-auto'>
                            실제 면접관과 같은 AI가 당신만의 맞춤 질문을 만들고,
                            <span className='font-semibold text-gray-900'> 적절한 피드백</span>을
                            주며 면접 실력을 키워드립니다.
                        </Paragraph>
                    </div>

                    {/* CTA 버튼 */}
                    <div className='flex justify-center items-center mb-8'>
                        <Link href='/ai-interview/select'>
                            <Button
                                type='primary'
                                size='large'
                                className='!h-16 !px-12 !text-xl !font-bold !bg-gradient-to-r !from-blue-600 !to-green-600 hover:!from-blue-700 hover:!to-green-700 !border-0 !rounded-2xl !shadow-2xl !text-white'
                                icon={<ArrowRightOutlined />}
                            >
                                베타 버전 체험하기
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 하단 AI 면접 정보 카드 섹션 */}
                <div className='flex-shrink-0 pb-8'>
                    <Row gutter={[24, 24]} justify='center'>
                        <Col xs={24} lg={8}>
                            <AiInterviewInfoCard {...aiInterviewData.main} />
                        </Col>
                        <Col xs={24} lg={8}>
                            <AiInterviewInfoCard {...aiInterviewData.features[0]} />
                        </Col>
                        <Col xs={24} lg={8}>
                            <AiInterviewInfoCard {...aiInterviewData.features[1]} />
                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
}
