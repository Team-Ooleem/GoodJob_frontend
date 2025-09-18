import { api } from '@/apis/api';

export type JobExtractOk = {
    ok: true;
    url: string;
    source: 'html' | 'ocr' | 'mixed';
    title?: string;
    company?: string;
    content: string;
    summary?: string;
    imagesTried?: string[];
    meta?: Record<string, string>;
};

export type JobExtractFail = {
    ok: false;
    url: string;
    error?: string;
};

export type JobExtractResult = JobExtractOk | JobExtractFail;

/**
 * 채용공고 URL 사전 검증/추출 API (백엔드: POST /api/ai/job-extract)
 */
export const jobPostApi = {
    extract: async (url: string, sessionId?: string): Promise<JobExtractResult> => {
        const path = process.env.NEXT_PUBLIC_JOB_EXTRACT_PATH || 'ai/job-extract';
        const body: any = { url };
        if (sessionId) body.sessionId = sessionId;
        const res = await api.post(path, body);
        return res.data as JobExtractResult;
    },
};
