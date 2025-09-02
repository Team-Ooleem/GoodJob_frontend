'use client';

import { useState } from 'react';
import { Button, Card, Typography, Space, Row, Col, Input, Radio, Form, message } from 'antd';
import {
    FileTextOutlined,
    LinkOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

// Dummy 이력서 데이터
const dummyResumes = [
    {
        id: 1,
        title: '프론트엔드 개발자 이력서',
        position: 'Frontend Developer',
        company: 'TechCorp',
        createdAt: '2024-01-15',
        experience: '3년',
        skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    },
    {
        id: 2,
        title: '풀스택 개발자 이력서',
        position: 'Full Stack Developer',
        company: 'StartupXYZ',
        createdAt: '2024-01-10',
        experience: '5년',
        skills: ['React', 'Node.js', 'Python', 'PostgreSQL'],
    },
    {
        id: 3,
        title: '백엔드 개발자 이력서',
        position: 'Backend Developer',
        company: 'DataFlow',
        createdAt: '2024-01-08',
        experience: '4년',
        skills: ['Java', 'Spring Boot', 'MySQL', 'Redis'],
    },
    {
        id: 4,
        title: 'DevOps 엔지니어 이력서',
        position: 'DevOps Engineer',
        company: 'CloudTech',
        createdAt: '2024-01-05',
        experience: '6년',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    },
];

export default function AiInterviewSelectPage() {
    const [selectedResume, setSelectedResume] = useState<number | null>(null);
    const [jobPostUrl, setJobPostUrl] = useState('');
    const [form] = Form.useForm();
    const router = useRouter();

    const handleResumeSelect = (resumeId: number) => {
        setSelectedResume(resumeId);
    };

    const handleStartInterview = () => {
        if (!selectedResume) {
            message.error('이력서를 선택해주세요.');
            return;
        }

        if (!jobPostUrl.trim()) {
            message.error('채용공고 URL을 입력해주세요.');
            return;
        }

        // URL 유효성 검사 (간단한 검사)
        try {
            new URL(jobPostUrl);
        } catch {
            message.error('올바른 URL 형식을 입력해주세요.');
            return;
        }

        // 선택된 이력서와 채용공고 URL을 저장하고 설정 페이지로 이동
        const selectedResumeData = dummyResumes.find((resume) => resume.id === selectedResume);

        // 로컬 스토리지에 데이터 저장 (실제로는 상태 관리 라이브러리 사용 권장)
        localStorage.setItem('selectedResume', JSON.stringify(selectedResumeData));
        localStorage.setItem('jobPostUrl', jobPostUrl);

        message.success('모의면접 설정을 진행합니다.');
        router.push('/ai-interview/setting');
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
            <div className='container mx-auto px-4 max-w-6xl'>
                {/* Header */}
                <div className='text-center mb-8'>
                    <Title level={1} className='!text-4xl !font-bold !text-gray-800 mb-4'>
                        모의면접 준비
                    </Title>
                    <Paragraph className='!text-lg !text-gray-600 max-w-2xl mx-auto'>
                        이력서를 선택하고 채용공고 URL을 입력하여 맞춤형 모의면접을 시작하세요.
                    </Paragraph>
                </div>

                <Row gutter={[24, 24]}>
                    {/* 이력서 선택 섹션 */}
                    <Col xs={24} lg={16}>
                        <Card className='!border-0 !shadow-lg' bodyStyle={{ padding: '32px' }}>
                            <Space direction='vertical' size='large' className='w-full'>
                                <div className='flex items-center gap-3 mb-4'>
                                    <FileTextOutlined className='text-3xl text-blue-500' />
                                    <Title level={3} className='!mb-0'>
                                        이력서 선택
                                    </Title>
                                </div>

                                <Paragraph className='!text-gray-600'>
                                    모의면접에 사용할 이력서를 선택해주세요. 선택한 이력서를
                                    바탕으로 AI가 맞춤형 질문을 생성합니다.
                                </Paragraph>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    {dummyResumes.map((resume) => (
                                        <Card
                                            key={resume.id}
                                            className={`cursor-pointer transition-all duration-300 ${
                                                selectedResume === resume.id
                                                    ? '!border-blue-500 !shadow-lg !bg-blue-50'
                                                    : '!border-gray-200 hover:!border-blue-300 hover:!shadow-md'
                                            }`}
                                            bodyStyle={{ padding: '20px' }}
                                            onClick={() => handleResumeSelect(resume.id)}
                                        >
                                            <Space
                                                direction='vertical'
                                                size='small'
                                                className='w-full'
                                            >
                                                <div className='flex items-center justify-between'>
                                                    <Text className='!font-semibold !text-lg !text-gray-800'>
                                                        {resume.title}
                                                    </Text>
                                                    {selectedResume === resume.id && (
                                                        <CheckCircleOutlined className='text-blue-500 text-xl' />
                                                    )}
                                                </div>

                                                <div className='space-y-1'>
                                                    <Text className='!text-gray-600 block'>
                                                        <strong>포지션:</strong> {resume.position}
                                                    </Text>
                                                    <Text className='!text-gray-600 block'>
                                                        <strong>회사:</strong> {resume.company}
                                                    </Text>
                                                    <Text className='!text-gray-600 block'>
                                                        <strong>경력:</strong> {resume.experience}
                                                    </Text>
                                                    <Text className='!text-gray-600 block'>
                                                        <strong>생성일:</strong> {resume.createdAt}
                                                    </Text>
                                                </div>

                                                <div>
                                                    <Text className='!text-gray-600 block mb-2'>
                                                        <strong>주요 기술:</strong>
                                                    </Text>
                                                    <div className='flex flex-wrap gap-1'>
                                                        {resume.skills.map((skill, index) => (
                                                            <span
                                                                key={index}
                                                                className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full'
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Space>
                                        </Card>
                                    ))}
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* 채용공고 URL 입력 섹션 */}
                    <Col xs={24} lg={8}>
                        <Card
                            className='!h-full !border-0 !shadow-lg'
                            bodyStyle={{ padding: '32px' }}
                        >
                            <Space direction='vertical' size='large' className='w-full'>
                                <div className='flex items-center gap-3'>
                                    <LinkOutlined className='text-3xl text-green-500' />
                                    <Title level={3} className='!mb-0'>
                                        채용공고 URL
                                    </Title>
                                </div>

                                <Paragraph className='!text-gray-600'>
                                    지원하고자 하는 채용공고의 URL을 입력해주세요. 이를 바탕으로 더
                                    정확한 면접 질문을 생성합니다.
                                </Paragraph>

                                <Form form={form} layout='vertical' className='w-full'>
                                    <Form.Item label='채용공고 URL' required className='!mb-4'>
                                        <Input
                                            placeholder='https://example.com/job-posting'
                                            value={jobPostUrl}
                                            onChange={(e) => setJobPostUrl(e.target.value)}
                                            size='large'
                                            className='!rounded-lg'
                                        />
                                    </Form.Item>
                                </Form>

                                <div className='bg-blue-50 rounded-lg p-4'>
                                    <Text className='!text-blue-700 !text-sm'>
                                        💡 <strong>팁:</strong> 채용공고 URL을 입력하면 해당
                                        포지션에 맞는 구체적인 질문을 받을 수 있습니다.
                                    </Text>
                                </div>

                                <Button
                                    type='primary'
                                    size='large'
                                    className='!h-12 !w-full !text-lg !font-semibold'
                                    icon={<ArrowRightOutlined />}
                                    onClick={handleStartInterview}
                                    disabled={!selectedResume || !jobPostUrl.trim()}
                                >
                                    모의면접 설정으로 이동
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* 선택 요약 */}
                {selectedResume && (
                    <Card className='!border-0 !shadow-lg mt-8 !bg-green-50'>
                        <div className='text-center'>
                            <Title level={4} className='!text-green-700 !mb-2'>
                                선택 완료
                            </Title>
                            <Text className='!text-green-600'>
                                {dummyResumes.find((r) => r.id === selectedResume)?.title}이
                                선택되었습니다.
                                {jobPostUrl && ' 채용공고 URL도 입력되었습니다.'}
                            </Text>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
