'use client';

import { Card, Button, Typography, Space } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

// global components
import { Header, Footer } from '@/components';

const { Title, Text } = Typography;

export default function LoginPage() {
    const handleGoogleLogin = () => {
        console.log('NEXT_PUBLIC_BACKEND_ORIGIN =', process.env.NEXT_PUBLIC_BACKEND_ORIGIN);
        // 백엔드 Nest API 서버로 이동 → 거기서 구글 로그인 리다이렉트
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? 'http://localhost:4000';
        window.location.href = `${backendUrl}/api/auth/google`;
    };

    return (
        <div className='min-h-screen flex flex-col'>
            <Header />

            {/* 메인 콘텐츠 */}
            <div className='flex-1 flex items-center justify-center bg-gray-50 py-12'>
                <div className='max-w-md w-full mx-4'>
                    <Card className='shadow-lg'>
                        <div className='text-center mb-8'>
                            <Title level={2} className='text-gray-800 mb-2'>
                                환영합니다!
                            </Title>
                            <Text className='text-gray-600'>
                                소셜 계정으로 간편하게 로그인하세요
                            </Text>
                        </div>

                        <Space direction='vertical' size='large' className='w-full'>
                            <Button
                                type='primary'
                                size='large'
                                icon={<GoogleOutlined />}
                                onClick={handleGoogleLogin}
                                className='w-full h-12 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-medium'
                            >
                                Google로 계속하기
                            </Button>
                        </Space>

                        <div className='text-center mt-6'>
                            <Text className='text-xs text-gray-500'>
                                로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                            </Text>
                        </div>
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    );
}
