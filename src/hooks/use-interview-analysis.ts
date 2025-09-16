import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/constants/config';
import type { InterviewAnalysisResult } from '@/types/report';

// 새 리포트 분석 요청/응답 타입 (백엔드 스키마 반영)
export interface AnalyzeReportRequest {
    sessionId: string;
    qa: Array<{ question: string; answer: string }>;
    llmContentScore?: number;
    llmContextScore?: number;
}

export interface AnalyzeReportResponse {
    success: boolean;
    data: InterviewAnalysisResult;
}

// 리포트 분석 호출
const analyzeReport = async (
    request: AnalyzeReportRequest,
): Promise<AnalyzeReportResponse> => {
    const { sessionId, qa, llmContentScore, llmContextScore } = request;
    const response = await fetch(`${API_BASE_URL}/report/${sessionId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qa, llmContentScore, llmContextScore }),
    });
    if (!response.ok) {
        throw new Error(`리포트 분석 API 호출 실패: ${response.status}`);
    }
    return response.json();
};

export const useInterviewAnalysis = () => {
    return useMutation<AnalyzeReportResponse, Error, AnalyzeReportRequest>({
        mutationFn: analyzeReport,
        onSuccess: (data) => {
            console.log('✅ 리포트 분석 성공:', data);
        },
        onError: (error) => {
            console.error('❌ 리포트 분석 실패:', error);
        },
    });
};
