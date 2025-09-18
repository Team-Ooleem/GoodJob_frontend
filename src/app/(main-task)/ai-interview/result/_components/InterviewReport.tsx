// result/_components/InterviewReport.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Alert } from 'antd';
import { Spin, Space, Button } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { api } from '@/apis/api';

// 분리된 컴포넌트들 import
import {
    OverallScoreCard,
    DetailedScoresCard,
    ExpressionIndicesCard,
    TextAnalysisCard,
    AudioVisualAnalysisCard,
    QuestionFeedbackCard,
    OverallEvaluationCard,
    SelfIntroScriptCard,
} from './report-cards';

// 전체 점수 API 호출 함수
const getOverallScore = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/overall`);
    return response.data;
};

export default function InterviewReport() {
    const [sessionId, setSessionId] = useState<string | null>(null);

    // 클라이언트 사이드에서만 실행
    useEffect(() => {
        // localStorage에서 aiInterviewSessionId 받아오기
        const value = localStorage.getItem('aiInterviewSessionId');
        setSessionId(value || null);
    }, []);

    // 전체 점수 데이터 쿼리
    const {
        data: overallData,
        isLoading: isReportLoading,
        error: reportError,
    } = useQuery({
        queryKey: ['overall-score', sessionId],
        queryFn: async () => {
            if (!sessionId) {
                throw new Error('면접 세션을 찾을 수 없습니다.');
            }

            const report = await getOverallScore(sessionId);

            if (report?.success && report?.data) {
                return report.data;
            } else {
                throw new Error('서버 리포트 데이터가 유효하지 않습니다.');
            }
        },
        enabled: !!sessionId,
        retry: 1,
    });

    const isLoading = isReportLoading;
    const error = reportError?.message || null;

    // 로딩 상태
    if (isLoading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
                <div className='text-center'>
                    <Spin size='large' />
                    <div className='mt-4 text-lg text-gray-600'>면접 결과를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error || !overallData) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
                <Card className='max-w-md mx-auto'>
                    <Alert
                        message='결과 로드 실패'
                        description={error || '면접 결과를 찾을 수 없습니다.'}
                        type='error'
                        showIcon
                        className='mb-4'
                    />
                    <div className='text-center'>
                        <Space>
                            <Link href='/ai-interview'>
                                <Button type='primary'>메인으로 돌아가기</Button>
                            </Link>
                            <Link href='/ai-interview/select'>
                                <Button>다시 면접하기</Button>
                            </Link>
                        </Space>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className='interview-report'>
            {/* 헤더 */}
            <div className='text-center mb-8'>
                <h1 className='text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3'>
                    <Trophy className='text-yellow-500' />
                    AI 모의면접 결과 리포트
                </h1>
                <div className='text-sm text-gray-500 mb-4'>
                    <div>세션 ID: {sessionId || 'unknown'}</div>
                    <div>면접 일시: {new Date().toLocaleString('ko-KR')}</div>
                </div>
            </div>

            {/* 전체 점수 카드 */}
            <OverallScoreCard
                analysisResult={{
                    overall_score: overallData.overallScore,
                    detailed_scores: { content30: 0, context30: 0, expression40: 0 },
                }}
            />

            {/* 세부 점수 (내용/맥락/표현 = 30/30/40) */}
            <DetailedScoresCard sessionId={sessionId || 'unknown'} />

            {/* 표현 지수 */}
            <ExpressionIndicesCard sessionId={sessionId || 'unknown'} />

            {/* 텍스트 분석 요약 */}
            <TextAnalysisCard sessionId={sessionId || 'unknown'} />

            {/* 음성/영상 분석 요약 */}
            <AudioVisualAnalysisCard sessionId={sessionId || 'unknown'} />

            {/* 질문별 상세 피드백 */}
            <QuestionFeedbackCard
                sessionId={sessionId || 'unknown'}
                qaList={[]} // 서버에서 받아오므로 빈 배열로 설정
            />

            {/* 종합 평가 및 강점/개선사항 */}
            <OverallEvaluationCard sessionId={sessionId || 'unknown'} />

            {/* 1분 자기소개 대본 */}
            <SelfIntroScriptCard sessionId={sessionId || 'unknown'} />

            {/* 인쇄용 스타일 */}
            <style jsx>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                    .shadow-lg {
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb !important;
                    }
                }
            `}</style>
        </div>
    );
}
