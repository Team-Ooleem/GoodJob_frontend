import { api } from '@/apis/api';

// AI 인터뷰 리포트 상세 조회 API (세션 ID로 조회)
export const getAiInterviewReportById = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}`);
    return response.data;
};
