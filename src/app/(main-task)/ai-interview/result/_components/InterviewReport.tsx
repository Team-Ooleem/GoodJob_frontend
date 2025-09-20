// result/_components/InterviewReport.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Alert } from 'antd';
import { Spin, Space, Button } from 'antd';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/apis/api';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { InterviewAPI } from '../../sessions/_apis/interview-api';
import { useRef } from 'react';

// 분리된 컴포넌트들 import
import {
    OverallScoreCard,
    TextAnalysisCard,
    AudioVisualAnalysisCard,
    QuestionFeedbackCard,
    SelfIntroScriptCard,
} from './report-cards';

// 전체 점수 API 호출 함수
const getOverallScore = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}/overall`);
    return response.data;
};

export default function InterviewReport() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();
    const redirectRef = useRef(false);

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

    // 기본 접근 가드: 세션이 없거나 서버 상태상 리포트가 없으면 리다이렉트
    useEffect(() => {
        if (typeof window === 'undefined') return;
        // 세션 자체가 없으면 바로 가드
        if (!sessionId) {
            if (!redirectRef.current) {
                redirectRef.current = true;
                alert('세션 정보가 없습니다. 이력서 선택 화면으로 이동합니다.');
                router.replace('/ai-interview/select');
            }
            return;
        }
        (async () => {
            try {
                const st = await InterviewAPI.getSessionStatus(sessionId);
                if (!st?.ok || !st.exists || !st.hasReport) {
                    if (!redirectRef.current) {
                        redirectRef.current = true;
                        alert('세션이 유효하지 않습니다. 이력서 선택 화면으로 이동합니다.');
                        router.replace('/ai-interview/select');
                    }
                }
            } catch {
                if (!redirectRef.current) {
                    redirectRef.current = true;
                    alert('세션이 유효하지 않습니다. 이력서 선택 화면으로 이동합니다.');
                    router.replace('/ai-interview/select');
                }
            }
        })();
    }, [sessionId, router]);

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
        // 화면 깜빡임 방지를 위해 빈 상태 반환 (리다이렉트 진행)
        return null;
    }

    return (
        <div className='interview-report'>
            {/* 통합된 전체 점수 카드 (세부 점수 + 표현 지수 포함) */}
            <OverallScoreCard
                analysisResult={{
                    overall_score: overallData?.overallScore,
                    detailed_scores: { content30: 0, context30: 0, expression40: 0 },
                }}
                userName={user?.name || '응시자'}
                sessionId={sessionId || 'unknown'}
            />

            {/* 텍스트 분석 요약 */}
            <TextAnalysisCard sessionId={sessionId || 'unknown'} />

            {/* 음성/영상 분석 요약 */}
            <AudioVisualAnalysisCard sessionId={sessionId || 'unknown'} />

            {/* 질문별 상세 피드백 */}
            <QuestionFeedbackCard
                sessionId={sessionId || 'unknown'}
                qaList={[]} // 서버에서 받아오므로 빈 배열로 설정
            />

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
