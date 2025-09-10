'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Typography, Tabs, message, Spin } from 'antd';
import { VideoCameraOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { api } from '@/apis/api';

const { Title, Paragraph, Text } = Typography;

// 타입 정의
interface Resume {
    id: number;
    title: string;
    position: string;
    company: string;
    createdAt: string;
    experience: string;
    skills: string[];
}

export default function AiInterviewSelectPage() {
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResume, setSelectedResume] = useState<number | null>(null);
    const [jobPostUrl, setJobPostUrl] = useState('');
    const [activeTab, setActiveTab] = useState('resume');
    const [buttonAnimation, setButtonAnimation] = useState(false);
    const router = useRouter();

    // JWT 쿠키 기반 사용자 정보 조회
    const { user, isLoading: authLoading } = useAuth();
    const userId = user?.idx ?? null;

    useEffect(() => {
        if (userId) {
            fetchResumes(userId);
        }
    }, [userId]);

    const fetchResumes = async (uid: number) => {
        try {
            setLoading(true);
            const { data } = await api.get<Resume[]>(`/resumes/user/${uid}`);
            setResumes(data);
        } catch (error) {
            console.error('Error fetching resumes:', error);
            message.error('이력서를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleResumeSelect = (resumeId: number) => {
        setSelectedResume(resumeId);
        // 버튼 애니메이션 트리거
        setButtonAnimation(true);
        setTimeout(() => setButtonAnimation(false), 1000);

        // 이력서 선택 후 자동으로 채용공고 선택 탭으로 이동
        setTimeout(() => {
            setActiveTab('job');
        }, 500); // 0.5초 후 탭 변경
    };

    const handleStartInterview = () => {
        if (resumes.length > 0 && !selectedResume) {
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

        // 선택된 이력서 또는 프로필 기반 데이터 저장
        if (resumes.length > 0 && selectedResume) {
            const selectedResumeData = resumes.find((resume) => resume.id === selectedResume);
            sessionStorage.setItem('selectedResume', JSON.stringify(selectedResumeData));
            sessionStorage.setItem('interviewType', 'resume-based');
        } else {
            // 프로필 기반 면접
            sessionStorage.setItem('interviewType', 'profile-based');
        }

        sessionStorage.setItem('jobPostUrl', jobPostUrl);

        message.success('환경 체크를 진행합니다.');
        router.push('/ai-interview/setting');
    };

    if (loading || authLoading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'>
                <Spin size='large' />
            </div>
        );
    }

    const tabItems = [
        {
            key: 'resume',
            label: '이력서 선택',
        },
        {
            key: 'job',
            label: '채용공고 선택',
        },
    ];

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
            <Card className='w-full max-w-xl shadow-xl border-0 rounded-2xl overflow-hidden'>
                {/* 탭 네비게이션 */}
                <div className='px-8 pt-8 pb-4'>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        className='interview-tabs'
                        tabBarStyle={{
                            marginBottom: 0,
                            borderBottom: 'none',
                        }}
                    />
                </div>

                {/* 메인 콘텐츠 */}
                <div className='px-8 pb-8'>
                    {/* 섹션 제목 */}
                    <div className='flex items-center justify-between mb-6'>
                        <h2 className='text-3xl font-bold text-gray-900 mb-0'>
                            AI 모의면접 진행하기
                        </h2>
                        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                            <VideoCameraOutlined className='text-blue-600 text-lg' />
                        </div>
                    </div>

                    {/* 면접 정보 */}
                    <div className='mb-8'>
                        <p className='text-gray-600 text-lg'>
                            AI 모의면접을 위한 기본정보를 설정해 주세요.
                        </p>
                    </div>

                    {/* 구분선 */}
                    <div className='mb-8'>
                        <div className='h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent'></div>
                    </div>

                    {/* 이력서 선택 탭 */}
                    {activeTab === 'resume' && (
                        <div className='mb-8'>
                            {resumes.length > 0 ? (
                                <div className='max-h-80 overflow-y-auto space-y-3 pr-2'>
                                    {resumes.map((resume) => (
                                        <div
                                            key={resume.id}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                                selectedResume === resume.id
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 hover:border-green-300'
                                            }`}
                                            onClick={() => handleResumeSelect(resume.id)}
                                        >
                                            <div className='flex items-center justify-between'>
                                                <div>
                                                    <Text className='font-semibold text-gray-900'>
                                                        {resume.title}
                                                    </Text>
                                                    {/* <div className='text-sm text-gray-600 mt-1'>
                                                        {resume.position} · {resume.company}
                                                    </div> */}
                                                </div>
                                                {selectedResume === resume.id && (
                                                    <div className='w-5 h-5 bg-green-500 rounded-full flex items-center justify-center'>
                                                        <div className='w-2 h-2 bg-white rounded-full'></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='text-center py-6'>
                                    <p className='text-gray-600 text-lg font-normal block mb-1'>
                                        등록된 이력서가 없습니다
                                    </p>
                                    <p className='text-gray-500 text-lg font-normal'>
                                        프로필 기반으로 면접을 진행합니다. 채용공고를 등록해주세요.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 채용공고 선택 탭 */}
                    {activeTab === 'job' && (
                        <div className='mb-8'>
                            <div className='space-y-4'>
                                <div>
                                    <p className='text-gray-700 font-medium text-lg block mb-2'>
                                        채용공고 URL
                                    </p>
                                    <input
                                        type='url'
                                        placeholder='https://example.com/job-posting'
                                        value={jobPostUrl}
                                        onChange={(e) => {
                                            setJobPostUrl(e.target.value);
                                            // URL 입력 시 버튼 애니메이션 트리거
                                            setButtonAnimation(true);
                                            setTimeout(() => setButtonAnimation(false), 1000);
                                        }}
                                        className='w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors duration-200 text-lg'
                                    />
                                </div>

                                {jobPostUrl &&
                                    (() => {
                                        try {
                                            new URL(jobPostUrl);
                                            return (
                                                <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
                                                    <div className='flex items-center'>
                                                        <div className='w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3'>
                                                            <div className='w-2 h-2 bg-white rounded-full'></div>
                                                        </div>
                                                        <p className='text-green-700 text-base'>
                                                            채용공고 URL이 입력되었습니다.
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        } catch {
                                            return (
                                                <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
                                                    <div className='flex items-center'>
                                                        <div className='w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3'>
                                                            <div className='w-2 h-2 bg-white rounded-full'></div>
                                                        </div>
                                                        <p className='text-red-700 text-base'>
                                                            올바른 URL 형식을 입력해주세요.
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })()}
                            </div>
                        </div>
                    )}

                    {/* 시작 버튼 */}
                    <div className='text-center'>
                        <Button
                            type='primary'
                            size='large'
                            className={`!h-16 !px-16 !text-xl !font-semibold !bg-green-600 hover:!bg-green-700 !border-0 !rounded-xl !shadow-lg !text-white transition-all duration-300 ${
                                buttonAnimation ? 'animate-pulse scale-105' : ''
                            }`}
                            onClick={handleStartInterview}
                            disabled={
                                resumes.length > 0
                                    ? !selectedResume || !jobPostUrl.trim()
                                    : !jobPostUrl.trim()
                            }
                        >
                            {resumes.length > 0
                                ? !selectedResume || !jobPostUrl.trim()
                                    ? '면접 설정을 완료해주세요'
                                    : '면접 환경 체크하기'
                                : !jobPostUrl.trim()
                                  ? '면접 설정을 완료해주세요'
                                  : '면접 환경 체크하기'}
                        </Button>
                    </div>
                </div>
            </Card>

            <style jsx global>{`
                .interview-tabs .ant-tabs-tab {
                    padding: 12px 24px !important;
                    font-size: 16px !important;
                    font-weight: 500 !important;
                }

                .interview-tabs .ant-tabs-tab-active {
                    color: #16a34a !important;
                }

                .interview-tabs .ant-tabs-ink-bar {
                    background: #16a34a !important;
                }
            `}</style>
        </div>
    );
}
