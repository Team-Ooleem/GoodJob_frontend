'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Typography, Tabs, message, Spin } from 'antd';
import { VideoCameraOutlined, InfoCircleOutlined, FileSearchOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks';
import { api } from '@/apis/api';

const { Title, Paragraph, Text } = Typography;

// 타입 정의
interface ResumeFileItem {
    id: string;
    originalName: string;
    url: string;
    size: number;
    mimetype: string;
    hasSummary: boolean;
    parseStatus: string; // 'none' | 'pending' | 'processing' | 'done' | 'error'
    createdAt: string;
}

export default function AiInterviewSelectPage() {
    const [resumes, setResumes] = useState<ResumeFileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResume, setSelectedResume] = useState<string | null>(null);
    const [jobPostUrl, setJobPostUrl] = useState('');
    const [activeTab, setActiveTab] = useState('resume');
    const [buttonAnimation, setButtonAnimation] = useState(false);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    // JWT 쿠키 기반 사용자 정보 조회
    const { user, isLoading: authLoading } = useAuth();
    const userId = user?.idx ?? null;

    useEffect(() => {
        if (userId) {
            fetchResumes(userId);
        }
    }, [userId]);

    const fetchResumes = async (_uid: number) => {
        try {
            setLoading(true);
            // 백엔드 변경에 맞춰 내 이력서 파일 목록 API 사용
            const { data } = await api.get<ResumeFileItem[]>(`/resume-files`);
            setResumes(data);
        } catch (error) {
            console.error('Error fetching resumes:', error);
            message.error('이력서를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleResumeSelect = (resumeId: string) => {
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
            if (!selectedResumeData) {
                message.error('선택한 이력서를 확인할 수 없습니다.');
                return;
            }
            if (!selectedResumeData.hasSummary || selectedResumeData.parseStatus !== 'done') {
                message.warning('이력서 요약 생성 중입니다. 완료 후 다시 시도해주세요.');
                return;
            }
            // 신규: 서버에서 요약을 찾아 쓰도록 파일 ID 저장
            sessionStorage.setItem('selectedResumeId', selectedResumeData.id);
            sessionStorage.setItem('interviewType', 'resume-based');
        } else {
            // 프로필 기반 면접
            sessionStorage.setItem('interviewType', 'profile-based');
        }

        sessionStorage.setItem('jobPostUrl', jobPostUrl);

        message.success('환경 체크를 진행합니다.');
        router.push('/ai-interview/setting');
    };

    const handleUploadFile = async (file: File) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            message.error('PDF 파일만 업로드할 수 있습니다.');
            return;
        }
        try {
            setUploading(true);
            const form = new FormData();
            form.append('file', file);
            const uploadRes = await api.post(`resume-files`, form, {
                timeout: 120000,
            });
            const { id } = uploadRes.data as { id: string };
            // 업로드 직후 비동기 파싱/요약 시작
            await api.post(`resume-files/${id}/parse`);
            message.success('업로드 완료! 요약을 생성 중입니다. 잠시 후 새로고침됩니다.');
            // 조금 있다 목록 새로고침
            setTimeout(() => fetchResumes(userId as number), 1200);
        } catch (e: any) {
            console.error('파일 업로드 실패', e);
            message.error('파일 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    // 자동 폴링 제거됨: 사용자가 업로드 후 1회 새로고침만 수행하고,
    // 그 외에는 수동으로 목록을 새로고침하거나 다시 진입하여 확인합니다.

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

    // 버튼 활성화 상태 계산
    const selectedItem = selectedResume ? resumes.find((r) => r.id === selectedResume) : null;
    const isResumeReady = resumes.length === 0 ? true : !!(selectedItem && selectedItem.hasSummary && selectedItem.parseStatus === 'done');
    const canStart = jobPostUrl.trim().length > 0 && isResumeReady && (resumes.length === 0 || !!selectedResume);

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
                                                        {resume.originalName}
                                                    </Text>
                                                    <div className='text-sm text-gray-600 mt-1'>
                                                        업로드: {new Date(resume.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className='flex items-center gap-2'>
                                                    <span
                                                        className={
                                                            'px-2 py-1 rounded text-xs ' +
                                                            (resume.parseStatus === 'done'
                                                                ? 'bg-green-100 text-green-700'
                                                                : resume.parseStatus === 'processing' ||
                                                                    resume.parseStatus === 'pending'
                                                                  ? 'bg-yellow-100 text-yellow-700'
                                                                  : resume.parseStatus === 'error'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-gray-100 text-gray-600')
                                                        }
                                                    >
                                                        {resume.parseStatus === 'done'
                                                            ? '요약 완료'
                                                            : resume.parseStatus === 'processing'
                                                              ? '요약 중'
                                                              : resume.parseStatus === 'pending'
                                                                ? '대기 중'
                                                                : resume.parseStatus === 'error'
                                                                  ? '오류'
                                                                  : '미설정'}
                                                    </span>
                                                    {selectedResume === resume.id && (
                                                        <div className='w-5 h-5 bg-green-500 rounded-full flex items-center justify-center'>
                                                            <div className='w-2 h-2 bg-white rounded-full'></div>
                                                        </div>
                                                    )}
                                                </div>
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
                            {/* 업로드 영역 */}
                            <div className='mt-4'>
                                <label className='block text-gray-700 font-medium mb-2'>PDF 업로드</label>
                                <input
                                    type='file'
                                    accept='application/pdf'
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleUploadFile(f);
                                        // reset input so selecting the same file again still triggers change
                                        e.currentTarget.value = '';
                                    }}
                                    disabled={uploading}
                                    className='block w-full text-gray-700'
                                />
                                {uploading && (
                                    <p className='text-sm text-gray-500 mt-2'>업로드 중…</p>
                                )}
                            </div>
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
                            disabled={!canStart}
                        >
                            {(() => {
                                if (resumes.length === 0) {
                                    return jobPostUrl.trim() ? '면접 환경 체크하기' : '면접 설정을 완료해주세요';
                                }
                                if (!selectedResume || !jobPostUrl.trim()) return '면접 설정을 완료해주세요';
                                if (!isResumeReady) return '요약 생성 중…';
                                return '면접 환경 체크하기';
                            })()}
                        </Button>
                        <div className='mt-4'>
                            <Button
                                icon={<FileSearchOutlined />}
                                onClick={() => router.push('/ai-interview/reports')}
                            >
                                리포트 목록 보기
                            </Button>
                        </div>
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
