'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, CheckCircle, Loader2 } from 'lucide-react';
import { useResumeUpload } from './_hooks/useResumeUpload';

export default function AiInterviewSelectPage() {
    const [jobPostUrl, setJobPostUrl] = useState('');
    const [activeTab, setActiveTab] = useState('resume');
    const [buttonAnimation, setButtonAnimation] = useState(false);
    const [isCheckingEnvironment, setIsCheckingEnvironment] = useState(false);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const router = useRouter();

    // 이력서 업로드 hook
    const {
        uploadedFile,
        uploadFile,
        startParsing,
        clearFile,
        isUploading,
        isParsing,
        uploadError,
        parseError,
    } = useResumeUpload();

    const handleFileUpload = async (file: File) => {
        try {
            await uploadFile(file);
        } catch (error) {
            console.error('파일 업로드 실패:', error);
        }
    };

    const handleStartInterview = async () => {
        // 이력서가 업로드되지 않았으면 면접을 시작할 수 없음
        if (!uploadedFile) {
            alert('이력서를 먼저 업로드해주세요.');
            return;
        }

        // 채용공고 URL이 입력된 경우에만 유효성 검사
        if (jobPostUrl.trim()) {
            // 사람인 사이트 URL인지 확인
            if (!jobPostUrl.includes('saramin.co.kr')) {
                alert('사람인 사이트의 채용공고 URL만 입력할 수 있습니다.');
                return;
            }

            // URL 유효성 검사
            try {
                new URL(jobPostUrl);
            } catch {
                alert('올바른 URL 형식을 입력해주세요.');
                return;
            }
        }

        // 환경 체크 시작
        setIsCheckingEnvironment(true);

        try {
            // 이력서가 업로드된 경우 파싱 시작
            if (uploadedFile) {
                await startParsing(uploadedFile.id);

                // 파싱 시작 후 파일 ID 저장
                sessionStorage.setItem('selectedResumeId', uploadedFile.id);
                sessionStorage.setItem('interviewType', 'resume-based');
            } else {
                // 프로필 기반 면접
                sessionStorage.setItem('interviewType', 'profile-based');
            }

            sessionStorage.setItem('jobPostUrl', jobPostUrl);

            // 파싱 성공 시 다음 페이지로 이동
            router.push('/ai-interview/setting');
        } catch (error) {
            console.error('파싱 실패:', error);
            alert(
                error instanceof Error
                    ? error.message
                    : '이력서 파싱에 실패했습니다. 다시 시도해주세요.',
            );
            setIsCheckingEnvironment(false);
        }
    };

    // 랜덤 메시지 배열
    const waitingMessages = [
        '이력서를 분석하고 있어요...',
        'AI가 당신의 경력을 파악하고 있습니다...',
        '면접 질문을 준비하고 있어요...',
        '최적의 면접 환경을 구성하고 있습니다...',
        '잠시만 기다려주세요...',
        '거의 다 준비되었어요...',
        '면접 준비가 한창이에요...',
        'AI 면접관이 준비 중입니다...',
    ];

    // 랜덤 메시지 변경
    useEffect(() => {
        if (isCheckingEnvironment) {
            const interval = setInterval(() => {
                setCurrentMessageIndex((prev) => (prev + 1) % waitingMessages.length);
            }, 3000); // 3초마다 메시지 변경

            return () => clearInterval(interval);
        } else {
            setCurrentMessageIndex(0);
        }
    }, [isCheckingEnvironment, waitingMessages.length]);

    // 버튼 활성화 상태 계산 - 이력서가 업로드되면 시작 가능
    const canStart = !!uploadedFile;

    return (
        <>
            {/* 이력서 분석 모달 */}
            {isCheckingEnvironment && (
                <div
                    className='fixed inset-0 flex items-center justify-center z-50'
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                >
                    <div className='bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl'>
                        <div className='text-center'>
                            {/* 로딩 아이콘 */}
                            <div className='mb-6'>
                                <div className='relative inline-block'>
                                    <Loader2 className='w-16 h-16 text-blue-600 animate-spin' />
                                </div>
                            </div>

                            {/* 제목 */}
                            <h3 className='text-2xl font-bold text-gray-900 mb-4'>
                                이력서 분석 중
                            </h3>

                            {/* 동적 메시지 */}
                            <div className='space-y-4 text-gray-600'>
                                <p className='text-lg min-h-[1.5rem] transition-all duration-500 ease-in-out'>
                                    {waitingMessages[currentMessageIndex]}
                                </p>

                                {/* 점 3개 애니메이션 */}
                                <div className='flex items-center justify-center gap-1'>
                                    <div
                                        className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                                        style={{ animationDelay: '0ms' }}
                                    ></div>
                                    <div
                                        className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                                        style={{ animationDelay: '150ms' }}
                                    ></div>
                                    <div
                                        className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'
                                        style={{ animationDelay: '300ms' }}
                                    ></div>
                                </div>
                            </div>

                            {/* 안내 문구 */}
                            <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                                <p className='text-sm text-blue-700'>
                                    이력서 분석이 완료되면 자동으로 면접 설정 페이지로 이동합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4'>
                <Card className='w-full max-w-xl shadow-xl border-0 rounded-2xl overflow-hidden'>
                    <CardHeader className='px-8 pt-8 pb-4'>
                        {/* 섹션 제목 */}
                        <div className='flex items-center justify-between mb-6'>
                            <CardTitle className='text-3xl font-bold text-gray-900 mb-0'>
                                AI 모의면접 진행하기
                            </CardTitle>
                            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                                <Video className='text-blue-600 text-lg' />
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

                        {/* 탭 네비게이션 */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
                            <TabsList className='grid w-full grid-cols-2'>
                                <TabsTrigger value='resume'>이력서 선택</TabsTrigger>
                                <TabsTrigger value='job'>채용공고 선택</TabsTrigger>
                            </TabsList>

                            {/* 이력서 선택 탭 */}
                            <TabsContent value='resume'>
                                {uploadedFile ? (
                                    <div className='p-4 border-2 border-blue-500 bg-blue-50 rounded-lg'>
                                        <div className='flex items-center justify-between'>
                                            <div>
                                                <p className='font-semibold text-gray-900'>
                                                    {uploadedFile.originalName || '업로드된 파일'}
                                                </p>
                                                <div className='text-sm text-gray-600 mt-1'>
                                                    업로드:{' '}
                                                    {new Date(
                                                        uploadedFile.createdAt,
                                                    ).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <span
                                                    className={
                                                        'px-2 py-1 rounded text-xs ' +
                                                        (uploadedFile.parseStatus === 'done'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : uploadedFile.parseStatus ===
                                                                'processing'
                                                              ? 'bg-yellow-100 text-yellow-700'
                                                              : uploadedFile.parseStatus === 'error'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-gray-100 text-gray-600')
                                                    }
                                                >
                                                    {uploadedFile.parseStatus === 'done'
                                                        ? '요약 완료'
                                                        : uploadedFile.parseStatus === 'processing'
                                                          ? '요약 중'
                                                          : uploadedFile.parseStatus === 'error'
                                                            ? '오류'
                                                            : '업로드 완료'}
                                                </span>
                                                <div className='w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center'>
                                                    <div className='w-2 h-2 bg-white rounded-full'></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='mt-3'>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={clearFile}
                                                className='!text-red-600 !border-red-300 hover:!bg-red-50'
                                            >
                                                파일 제거
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='text-center py-6'>
                                        <p className='text-gray-600 text-lg font-normal block mb-1'>
                                            이력서를 업로드 해주세요.
                                        </p>
                                        <p className='text-gray-500 text-lg font-normal'>
                                            이력서를 업로드하지 않으면 면접을 진행할 수가 없어요
                                            ㅠ_ㅠ
                                        </p>
                                    </div>
                                )}

                                {/* 업로드 영역 - 파일이 업로드되지 않았을 때만 표시 */}
                                {!uploadedFile && (
                                    <div>
                                        <div className='relative'>
                                            <Input
                                                type='file'
                                                accept='application/pdf'
                                                onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) handleFileUpload(f);
                                                    // reset input so selecting the same file again still triggers change
                                                    e.currentTarget.value = '';
                                                }}
                                                disabled={isUploading}
                                                className='absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10'
                                                id='pdf-upload'
                                            />
                                            <Label
                                                htmlFor='pdf-upload'
                                                className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200'
                                            >
                                                <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                                                    <svg
                                                        className='w-8 h-8 mb-4 text-gray-500'
                                                        aria-hidden='true'
                                                        xmlns='http://www.w3.org/2000/svg'
                                                        fill='none'
                                                        viewBox='0 0 20 16'
                                                    >
                                                        <path
                                                            stroke='currentColor'
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth='2'
                                                            d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.5c-.376 0-.75.072-1.09.213a5.5 5.5 0 0 0-1.44 10.5A5.5 5.5 0 0 0 7.5 16h6a5.5 5.5 0 0 0 5.5-5.5 5.5 5.5 0 0 0-5.5-5.5H13v3Z'
                                                        />
                                                    </svg>
                                                    <p className='mb-2 text-sm text-gray-500'>
                                                        <span className='font-semibold'>
                                                            클릭하여 PDF 파일 선택
                                                        </span>
                                                    </p>
                                                    <p className='text-xs text-gray-500'>
                                                        PDF 파일만 업로드 가능
                                                    </p>
                                                </div>
                                            </Label>
                                        </div>
                                        {isUploading && (
                                            <div className='mt-3 flex items-center justify-center'>
                                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2'></div>
                                                <p className='text-sm text-gray-500'>업로드 중…</p>
                                            </div>
                                        )}
                                        {uploadError && (
                                            <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg'>
                                                <p className='text-sm text-red-600'>
                                                    업로드 실패: {uploadError.message}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            {/* 채용공고 선택 탭 */}
                            <TabsContent value='job' className='mt-6'>
                                <div className='space-y-4'>
                                    {/* 안내문구 */}
                                    <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                                        <div className='flex items-start'>
                                            <div className='w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5'>
                                                <div className='w-2 h-2 bg-white rounded-full'></div>
                                            </div>
                                            <div>
                                                <p className='text-blue-800 font-medium text-sm mb-1'>
                                                    채용공고 URL (선택사항)
                                                </p>
                                                <p className='text-blue-700 text-sm'>
                                                    사람인 사이트의 채용공고 URL을 입력하면 더
                                                    정확한 면접을 진행할 수 있습니다.
                                                </p>
                                                <p className='text-blue-600 text-xs mt-1'>
                                                    예시:
                                                    https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=123456
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className='text-gray-700 font-medium text-lg block mb-2'>
                                            채용공고 URL
                                        </Label>
                                        <Input
                                            type='url'
                                            placeholder='https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=...'
                                            value={jobPostUrl}
                                            onChange={(e) => {
                                                setJobPostUrl(e.target.value);
                                                // URL 입력 시 버튼 애니메이션 트리거
                                                setButtonAnimation(true);
                                                setTimeout(() => setButtonAnimation(false), 1000);
                                            }}
                                            className='w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-200 text-lg'
                                        />
                                    </div>

                                    {jobPostUrl &&
                                        (() => {
                                            try {
                                                new URL(jobPostUrl);
                                                const isSaraminUrl =
                                                    jobPostUrl.includes('saramin.co.kr');
                                                return (
                                                    <div
                                                        className={`p-4 border rounded-lg ${
                                                            isSaraminUrl
                                                                ? 'bg-blue-50 border-blue-200'
                                                                : 'bg-yellow-50 border-yellow-200'
                                                        }`}
                                                    >
                                                        <div className='flex items-center'>
                                                            <div
                                                                className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                                                                    isSaraminUrl
                                                                        ? 'bg-blue-500'
                                                                        : 'bg-yellow-500'
                                                                }`}
                                                            >
                                                                <div className='w-2 h-2 bg-white rounded-full'></div>
                                                            </div>
                                                            <p
                                                                className={`text-base ${
                                                                    isSaraminUrl
                                                                        ? 'text-blue-700'
                                                                        : 'text-yellow-700'
                                                                }`}
                                                            >
                                                                {isSaraminUrl
                                                                    ? '사람인 채용공고 URL이 입력되었습니다.'
                                                                    : '사람인 사이트의 URL만 입력할 수 있습니다.'}
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
                            </TabsContent>
                        </Tabs>
                    </CardHeader>

                    <CardContent className='px-8 pb-8'>
                        {/* 시작 버튼 */}
                        <div className='text-center'>
                            <Button
                                size='lg'
                                className={`!h-16 !px-16 !text-xl !font-semibold !bg-blue-600 hover:!bg-blue-700 !border-0 !rounded-xl !shadow-lg !text-white !transition-all !duration-300 ${
                                    buttonAnimation ? '!animate-pulse !scale-105' : ''
                                }`}
                                onClick={handleStartInterview}
                                disabled={!canStart || isParsing || isCheckingEnvironment}
                            >
                                {(() => {
                                    if (isParsing) return '이력서 파싱 중…';
                                    if (!uploadedFile) return '이력서를 먼저 업로드해주세요';
                                    return '면접 환경 체크하기';
                                })()}
                            </Button>
                            {/* <div className='mt-4'>
                            <Button
                                variant='outline'
                                onClick={() => router.push('/ai-interview/reports')}
                                className='flex items-center gap-2'
                            >
                                <FileSearch className='w-4 h-4' />
                                리포트 목록 보기
                            </Button>
                        </div> */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
