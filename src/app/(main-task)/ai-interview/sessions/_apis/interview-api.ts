import { api } from '@/apis/api';
import { QuestionDto } from '../_hooks/useQuestionManager';

type SelectedResume = {
    id: number;
    title?: string;
    position?: string;
    company?: string;
    createdAt?: string;
    experience?: string;
    skills?: string[];
};

/**
 * 면접 관련 API 함수들
 * 질문 생성, 후속 질문, STT, 음성 분석 등의 API 호출을 담당
 */
export class InterviewAPI {
    /**
     * 첫 번째 면접 질문을 생성합니다
     */
    static async fetchFirstQuestion(): Promise<QuestionDto> {
        const selectedResumeId = sessionStorage.getItem('selectedResumeId') || undefined;

        let resumeSummary: string | null = null;
        try {
            const raw = sessionStorage.getItem('selectedResume');
            if (raw) {
                const r = JSON.parse(raw) as SelectedResume;
                const parts = [
                    r.title,
                    r.position ? `포지션: ${r.position}` : undefined,
                    r.company ? `회사: ${r.company}` : undefined,
                    r.experience ? `경력: ${r.experience}` : undefined,
                    Array.isArray(r.skills) && r.skills.length
                        ? `기술: ${r.skills.join(', ')}`
                        : undefined,
                ].filter(Boolean) as string[];
                if (parts.length) {
                    resumeSummary = parts.join(' | ');
                }
            }
        } catch (e) {
            console.warn('selectedResume 파싱 실패:', e);
        }

        if (!resumeSummary) {
            resumeSummary =
                localStorage.getItem('resumeSummary') ||
                '프론트엔드 경력 3년, Next.js/React, 크래프톤 정글 (부트캠프) 수료, Pintos 운영체제 프로젝트 수행 경험';
        }

        const jobPostUrl = sessionStorage.getItem('jobPostUrl') || undefined;
        const sessionId =
            typeof window !== 'undefined'
                ? localStorage.getItem('aiInterviewSessionId') || undefined
                : undefined;
        const payload: any = sessionId ? { sessionId } : {};
        if (selectedResumeId) payload.resumeFileId = selectedResumeId;
        else payload.resumeSummary = resumeSummary;
        if (jobPostUrl) payload.jobPostUrl = jobPostUrl;

        const res = await api.post(`ai/question`, payload, { timeout: 60000 });
        const data = res.data as { question: QuestionDto };
        return data.question;
    }

    /**
     * 후속 질문을 생성합니다
     */
    static async fetchFollowup(original: QuestionDto, answer: string): Promise<QuestionDto> {
        const sessionId =
            typeof window !== 'undefined'
                ? localStorage.getItem('aiInterviewSessionId') || undefined
                : undefined;
        const res = await api.post(
            `ai/followups`,
            { originalQuestion: original, answer, ...(sessionId ? { sessionId } : {}) },
            { timeout: 60000 },
        );
        const data = res.data as {
            followups: Array<{ id: string; parentId: string; text: string; reason: string }>;
        };
        return { id: data.followups[0].id, text: data.followups[0].text };
    }

    /**
     * Google STT를 사용하여 음성을 텍스트로 변환합니다
     */
    static async transcribeWithGoogleSTT(wavBlob: Blob): Promise<string> {
        const form = new FormData();
        form.append('file', wavBlob, 'answer.wav');

        const res = await api.post(`stt/transcribe-file`, form, {
            timeout: 120000,
        });

        const data = res.data as { success: boolean; result: { transcript: string } };
        if (!data?.success) throw new Error('STT 실패');
        return data.result.transcript || '';
    }

    /**
     * 음성 분석을 수행합니다
     */
    static async analyzeAudio(sessionId: string, questionId: string, wavBlob: Blob) {
        const form = new FormData();
        form.append('file', wavBlob, `q${questionId}.wav`);

        const analysisRes = await api.post(
            `/audio-metrics/${sessionId}/${questionId}/analyze`,
            form,
            { timeout: 120000 },
        );

        if (analysisRes.data?.ok) {
            console.log('백엔드를 통한 음성 분석 완료:', analysisRes.data.features);
        }
        return analysisRes.data;
    }

    /**
     * 문항별 내용/맥락 분석을 수행합니다
     */
    static async analyzeQuestionContent(
        sessionId: string,
        questionId: string,
        answer: string,
        qaList: Array<{ question: string; answer: string }>,
    ) {
        const selectedResumeId = sessionStorage.getItem('selectedResumeId') || undefined;
        const prevClaims = qaList
            .slice(Math.max(0, qaList.length - 3))
            .map((q) => (q?.answer || '').slice(0, 200))
            .filter(Boolean);

        const body: any = { answer };
        if (selectedResumeId) body.resumeFileId = selectedResumeId;
        if (prevClaims.length) body.prevClaims = prevClaims;

        await api.post(`ai/${sessionId}/${questionId}/analyze`, body, {
            timeout: 45000,
        });
    }

    /**
     * 웹캠 집계 데이터를 업로드합니다
     */
    static async uploadWebcamAggregate(sessionId: string, questionId: string, aggregate: any) {
        await api.post(`metrics/${sessionId}/${questionId}/aggregate`, aggregate, {
            timeout: 10000,
        });
    }

    /**
     * 서버에서 음성 지표를 가져옵니다
     */
    static async getServerAudioData(sessionId: string) {
        const audioRes = await api.get(`/audio-metrics/${sessionId}/overall`);
        if (audioRes.data?.ok && audioRes.data?.overall) {
            return audioRes.data.overall;
        }
        return null;
    }

    /**
     * 서버에서 문항별 음성 지표를 가져옵니다
     */
    static async getServerAudioPerQuestion(sessionId: string) {
        const audioPerQRes = await api.get(`/audio-metrics/${sessionId}`);
        if (audioPerQRes.data?.ok && audioPerQRes.data?.rows) {
            return audioPerQRes.data.rows;
        }
        return null;
    }

    /**
     * 세션을 완료하고 영상 집계를 finalize합니다
     */
    static async finalizeSession(sessionId: string) {
        const finalizeRes = await api.post(
            `/metrics/${sessionId}/finalize`,
            {},
            { timeout: 10000 },
        );
        return finalizeRes.data?.aggregate;
    }

    /**
     * 면접 결과를 분석합니다
     */
    static async analyzeInterviewResult(
        sessionId: string,
        qaList: Array<{ question: string; answer: string }>,
    ) {
        const res = await api.post(
            `/report/${sessionId}/analyze`,
            { qa: qaList },
            { timeout: 60000 },
        );
        if (res.data?.success) {
            return res.data.data;
        }
        return null;
    }
}
