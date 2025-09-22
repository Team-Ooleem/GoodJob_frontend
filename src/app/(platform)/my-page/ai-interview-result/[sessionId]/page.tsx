'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/apis/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Spin } from 'antd';

// report-cards 컴포넌트들 import
import {
    OverallScoreCard,
    TextAnalysisCard,
    AudioVisualAnalysisCard,
    QuestionFeedbackCard,
    SelfIntroScriptCard,
} from '@/app/(main-task)/ai-interview/result/_components/report-cards';

interface AiInterviewDetailPageProps {
    params: {
        sessionId: string;
    };
}

// 전체 점수 API 호출 함수
const getOverallScore = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/overall`);
    return response.data;
};

export default function AiInterviewDetailPage({ params }: AiInterviewDetailPageProps) {
    const { user } = useAuth();
    const { sessionId } = params;

    // 전체 점수 데이터 쿼리
    const {
        data: overallData,
        isLoading: isReportLoading,
        error: reportError,
    } = useQuery({
        queryKey: ['overall-score', sessionId],
        queryFn: async () => {
            const report = await getOverallScore(sessionId);

            if (report?.success && report?.data) {
                return report.data;
            } else {
                throw new Error('서버 리포트 데이터가 유효하지 않습니다.');
            }
        },
        retry: 1,
    });

    const isLoading = isReportLoading;
    const error = reportError?.message || null;

    // 로딩 상태
    if (isLoading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center'>
                <div className='text-center'>
                    <Spin size='large' />
                    <div className='mt-4 text-lg text-gray-600'>면접 결과를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='text-red-600 text-lg mb-4'>결과 로드 실패</div>
                    <div className='text-gray-600 mb-4'>
                        {error || '면접 결과를 찾을 수 없습니다.'}
                    </div>
                    <div className='flex justify-center gap-4'>
                        <Link prefetch={true} href='/my-page'>
                            <Button variant='outline'>마이페이지로 돌아가기</Button>
                        </Link>
                        <Link prefetch={true} href='/ai-interview/select'>
                            <Button>다시 면접하기</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8'>
            <div className='container mx-auto px-4'>
                <div className='interview-report space-y-6'>
                    {/* 통합된 전체 점수 카드 */}
                    <OverallScoreCard
                        analysisResult={{
                            overall_score: overallData?.overallScore,
                            detailed_scores: { content30: 0, context30: 0, expression40: 0 },
                        }}
                        userName={user?.name || '응시자'}
                        sessionId={sessionId}
                    />

                    {/* 텍스트 분석 요약 */}
                    <TextAnalysisCard sessionId={sessionId} />

                    {/* 음성/영상 분석 요약 */}
                    <AudioVisualAnalysisCard sessionId={sessionId} />

                    {/* 질문별 상세 피드백 */}
                    <QuestionFeedbackCard
                        sessionId={sessionId}
                        qaList={[]} // 서버에서 받아오므로 빈 배열로 설정
                    />

                    {/* 1분 자기소개 대본 */}
                    <SelfIntroScriptCard sessionId={sessionId} />
                </div>

                {/* 액션 버튼 */}
                <div className='text-center mt-8'>
                    <div className='flex justify-center gap-4'>
                        <Link prefetch={true} href='/my-page'>
                            <Button variant='outline' size='lg' className='flex items-center gap-2'>
                                <ArrowLeft className='w-4 h-4' />
                                마이페이지로 돌아가기
                            </Button>
                        </Link>
                        <Link prefetch={true} href='/ai-interview/select'>
                            <Button size='lg'>다시 면접하기</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
