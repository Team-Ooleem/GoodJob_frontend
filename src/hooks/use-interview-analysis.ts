import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/constants/config';

// 면접 분석 API 타입 정의
export interface InterviewAnalysisRequest {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
}

export interface InterviewAnalysisResponse {
    success: boolean;
    data: {
        overall_score: number;
        detailed_scores: {
            completeness: number;
            specificity: number;
            logic: number;
            impression: number;
        };
        strengths: string[];
        improvements: string[];
        detailed_feedback: {
            [key: string]: {
                score: number;
                feedback: string;
            };
        };
        overall_evaluation: string;
        recommendations: string[];
    };
    error?: string;
}

// 면접 분석 API 함수
const analyzeInterview = async (
    request: InterviewAnalysisRequest,
): Promise<InterviewAnalysisResponse> => {
    const response = await fetch(`${API_BASE_URL}/interview/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`면접 분석 API 호출 실패: ${response.status}`);
    }

    return response.json();
};

export const useInterviewAnalysis = () => {
    return useMutation<InterviewAnalysisResponse, Error, InterviewAnalysisRequest>({
        mutationFn: analyzeInterview,
        onSuccess: (data) => {
            console.log('✅ 면접 분석 성공:', data);
        },
        onError: (error) => {
            console.error('❌ 면접 분석 실패:', error);
        },
    });
};
