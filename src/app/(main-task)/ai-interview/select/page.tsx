'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Loader2, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useResumeUpload } from './_hooks/useResumeUpload';
import { api } from '@/apis/api';
import { jobPostApi, type JobPostSummary } from './_apis/job-post-api';

export default function AiInterviewSelectPage() {
    const [jobPostUrl, setJobPostUrl] = useState('');
    const [activeTab, setActiveTab] = useState('resume');
    const [buttonAnimation, setButtonAnimation] = useState(false);
    const [isCheckingEnvironment, setIsCheckingEnvironment] = useState(false);
    const [isVerifyingJob, setIsVerifyingJob] = useState(false);
    const [jobVerifyState, setJobVerifyState] = useState<'idle' | 'verifying' | 'success' | 'fail'>(
        'idle',
    );
    const [jobMeta, setJobMeta] = useState<{
        title?: string;
        company?: string;
        source?: string;
        url?: string;
        content?: string;
        summary?: string;
        summaryJson?: JobPostSummary;
        ts?: number;
    } | null>(null);
    const [jobVerifyNotice, setJobVerifyNotice] = useState<'none' | 'success' | 'failed'>('none');
    const [urlError, setUrlError] = useState<string | null>(null);
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

        // (이전 단계) 중복된 사전 추출 로직 제거됨 – 아래에서 일괄 처리합니다.

        try {
            // 채용공고 URL이 입력된 경우: 형식 검증 + 백엔드 사전 추출
            if (jobPostUrl.trim()) {
                try {
                    new URL(jobPostUrl);
                } catch {
                    setUrlError('올바른 URL 형식을 입력해주세요.');
                    return;
                }

                setIsVerifyingJob(true);
                setJobVerifyState('verifying');
                try {
                    const sid =
                        typeof window !== 'undefined'
                            ? localStorage.getItem('aiInterviewSessionId') || undefined
                            : undefined;
                    const result = await jobPostApi.extract(jobPostUrl.trim(), sid);
                    if (result.ok) {
                        const meta = {
                            url: result.url,
                            title: result.title,
                            company: result.company,
                            source: result.source,
                            // 서버에서 생성한 요약을 그대로 저장 (세션 캐시와 일관)
                            summary: result.summary,
                            summaryJson: result.summaryJson,
                            content: undefined,
                            ts: Date.now(),
                        };
                        setJobMeta(meta);
                        setJobVerifyState('success');
                        setJobVerifyNotice('success');
                        try {
                            sessionStorage.setItem('jobPostMeta', JSON.stringify(meta));
                        } catch {}
                    } else {
                        setJobVerifyState('fail');
                        setJobVerifyNotice('failed');
                    }
                } catch (e) {
                    console.error('채용공고 사전 추출 실패:', e);
                    setJobVerifyState('fail');
                    setJobVerifyNotice('failed');
                } finally {
                    setIsVerifyingJob(false);
                }
            } else {
                setJobVerifyState('idle');
                setJobVerifyNotice('none');
                setUrlError(null);
            }

            // 환경 체크 시작 (검증 이후 진행)
            setIsCheckingEnvironment(true);

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

    // 초기 세션 생성(선택 진입 시 즉시 발급) + 기존 세션 산출물 정리
    useEffect(() => {
        try {
            // 이전 세션 산출물(지표/리포트 캐시)은 혼선 방지를 위해 정리
            const keysToClear = [
                'interviewAudioOverallServer',
                'interviewAudioPerQuestionServer',
                'interviewAudioOverall',
                'interviewAudioPerQuestion',
                'interviewVisualOverall',
                'interviewVisualPerQuestion',
                'interviewAnalysis',
                'interviewQA',
                'aiInterviewSessionId',
            ];
            keysToClear.forEach((k) => localStorage.removeItem(k));
        } catch {}

        try {
            const sid = `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
            localStorage.setItem('aiInterviewSessionId', sid);

            // 인터뷰 세션 보장: finalize를 호출하면 interview_sessions에 INSERT IGNORE 됨
            api.post(`/metrics/${sid}/finalize`, {}, { timeout: 10000 }).catch((e) =>
                console.warn('세션 보장(finalize) 실패 또는 무시 가능:', e),
            );
        } catch (e) {
            console.warn('세션 ID 초기화 실패:', e);
        }
    }, []);

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
                                    <Loader2 className='w-16 h-16 text-sky-500 animate-spin' />
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

                                {/* 채용공고 검증 결과 안내 */}
                                {jobVerifyNotice === 'failed' && (
                                    <Alert className='border-yellow-300 bg-yellow-50 text-left'>
                                        <AlertTitle className='text-yellow-800'>
                                            채용공고 확인 실패
                                        </AlertTitle>
                                        <AlertDescription className='text-yellow-700'>
                                            채용공고 확인에 실패했습니다. 이력서 기반으로 면접이
                                            진행됩니다.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* 점 3개 애니메이션 */}
                                <div className='flex items-center justify-center gap-1'>
                                    <div
                                        className='w-2 h-2 bg-sky-400 rounded-full animate-bounce'
                                        style={{ animationDelay: '0ms' }}
                                    ></div>
                                    <div
                                        className='w-2 h-2 bg-sky-400 rounded-full animate-bounce'
                                        style={{ animationDelay: '150ms' }}
                                    ></div>
                                    <div
                                        className='w-2 h-2 bg-sky-400 rounded-full animate-bounce'
                                        style={{ animationDelay: '300ms' }}
                                    ></div>
                                </div>
                            </div>

                            {/* 안내 문구 */}
                            <div className='mt-6 p-4 bg-sky-50 border border-sky-200 rounded-lg'>
                                <p className='text-sm text-sky-700'>
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
                                    <div className='p-4 border-2 border-sky-400 bg-sky-50 rounded-lg'>
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
                                                            ? 'bg-sky-100 text-sky-700'
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
                                                <div className='w-5 h-5 bg-sky-400 rounded-full flex items-center justify-center'>
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
                                                    <FileText className='w-9 h-9 mb-4 text-gray-500' />
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
                                                setUrlError(null);
                                                // URL 입력 시 버튼 애니메이션 트리거
                                                setButtonAnimation(true);
                                                setTimeout(() => setButtonAnimation(false), 1000);
                                            }}
                                            className='w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition-colors duration-200 text-lg'
                                        />
                                    </div>

                                    {/* URL 형식 오류 */}
                                    {urlError && (
                                        <Alert variant='destructive'>
                                            <AlertTitle>입력 오류</AlertTitle>
                                            <AlertDescription>{urlError}</AlertDescription>
                                        </Alert>
                                    )}

                                    {/* 검증 상태 표시 */}
                                    {isVerifyingJob && (
                                        <Alert className='border-sky-300 bg-sky-50'>
                                            <AlertTitle className='text-sky-800'>
                                                채용공고 확인 중
                                            </AlertTitle>
                                            <AlertDescription className='flex items-center gap-2 text-sky-700'>
                                                <Loader2 className='w-4 h-4 animate-spin' /> 잠시만
                                                기다려주세요...
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {!isVerifyingJob && jobVerifyState === 'success' && jobMeta && (
                                        <Alert className='border-green-300 bg-green-50'>
                                            <AlertTitle className='text-green-800'>
                                                채용공고 확인됨
                                            </AlertTitle>
                                            <AlertDescription className='text-green-700'>
                                                {jobMeta.title || jobMeta.company ? (
                                                    <span>
                                                        {jobMeta.title
                                                            ? `제목: ${jobMeta.title}`
                                                            : ''}
                                                        {jobMeta.title && jobMeta.company
                                                            ? ' / '
                                                            : ''}
                                                        {jobMeta.company
                                                            ? `회사: ${jobMeta.company}`
                                                            : ''}
                                                    </span>
                                                ) : (
                                                    <span>채용공고를 성공적으로 확인했습니다.</span>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {!isVerifyingJob && jobVerifyState === 'fail' && (
                                        <Alert className='border-yellow-300 bg-yellow-50'>
                                            <AlertTitle className='text-yellow-800'>
                                                채용공고 확인 실패
                                            </AlertTitle>
                                            <AlertDescription className='text-yellow-700'>
                                                채용공고 확인에 실패했습니다. 이력서 기반으로 면접이
                                                진행됩니다.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {jobPostUrl &&
                                        (() => {
                                            try {
                                                new URL(jobPostUrl);
                                                const isSaraminUrl =
                                                    // jobPostUrl.includes('saramin.co.kr');
                                                    true;
                                                return (
                                                    <div
                                                        className={`p-4 border rounded-lg ${
                                                            isSaraminUrl
                                                                ? 'bg-sky-50 border-sky-200'
                                                                : 'bg-yellow-50 border-yellow-200'
                                                        }`}
                                                    >
                                                        <div className='flex items-center'>
                                                            <div
                                                                className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                                                                    isSaraminUrl
                                                                        ? 'bg-sky-400'
                                                                        : 'bg-yellow-500'
                                                                }`}
                                                            >
                                                                <div className='w-2 h-2 bg-white rounded-full'></div>
                                                            </div>
                                                            <p
                                                                className={`text-base ${
                                                                    isSaraminUrl
                                                                        ? 'text-sky-700'
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
                                className={`!h-16 !px-16 !text-xl !font-semibold !bg-sky-500 hover:!bg-sky-600 !border-0 !rounded-xl !shadow-lg !text-white !transition-all !duration-300 ${
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
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
