import { api } from '@/apis/api';

export interface ResumeFileItem {
    id: string;
    originalName: string;
    url: string;
    size: number;
    mimetype: string;
    hasSummary: boolean;
    parseStatus: string; // 'none' | 'pending' | 'processing' | 'done' | 'error'
    createdAt: string;
}

export const resumeApi = {
    // PDF 파일 업로드
    uploadResume: async (file: File) => {
        const form = new FormData();
        form.append('file', file, encodeURIComponent(file.name));
        const response = await api.post(`resume-files`, form);
        return response.data as { id: string; originalName: string };
    },

    // 이력서 파싱 및 요약 생성 (완료될 때까지 대기)
    parseResume: async (resumeId: string) => {
        console.log('API 호출 시작 - resumeId:', resumeId);
        console.log('API 호출 시작 시간:', new Date().toISOString());
        const response = await api.post(
            `resume-files/${resumeId}/parse`,
            {},
            {
                timeout: 120000, // 2분 타임아웃
            },
        );

        console.log('API 호출 완료 - resumeId:', resumeId);
        console.log('API 호출 완료 시간:', new Date().toISOString());

        return response.data;
    },
};
