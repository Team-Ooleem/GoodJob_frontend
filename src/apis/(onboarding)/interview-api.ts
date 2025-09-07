// 면접 분석 API
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

export const analyzeInterview = async (
    request: InterviewAnalysisRequest,
): Promise<InterviewAnalysisResponse> => {
    // 백엔드 서버 주소로 API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/interview/analyze`, {
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
