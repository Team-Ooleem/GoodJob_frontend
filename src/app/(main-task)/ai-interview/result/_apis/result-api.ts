// result/_apis/result-api.ts
import { api } from '@/apis/api';

// 면접 결과 관련 API 타입들
export interface AudioAnalysisData {
    overall?: {
        f0_mean?: number;
        f0_std?: number;
        f0_cv?: number;
        rms_cv?: number;
        jitter_like?: number;
        shimmer_like?: number;
        silence_ratio?: number;
        tone_score?: number;
        vibrato_score?: number;
        pace_score?: number;
        overall_voice_score?: number;
    };
    perQuestion?: Array<{
        questionNumber: number;
        question: string;
        audioUrl?: string;
        tone_score?: number;
        vibrato_score?: number;
        pace_score?: number;
        audioFeatures?: any;
    }>;
}

export interface VisualAnalysisData {
    overall?: {
        count?: number;
        confidence_mean?: number;
        smile_mean?: number;
        eye_contact_mean?: number;
        gaze_stability?: number;
        presence_dist?: {
            good?: number;
            average?: number;
            needs_improvement?: number;
        };
        level_dist?: {
            ok?: number;
            warning?: number;
            critical?: number;
        };
        confidence_score?: number;
        behavior_score?: number;
        overall_visual_score?: number;
    };
    perQuestion?: Record<string, any>;
}

export interface PerQuestionTextAnalysis {
    questionId: string;
    content?: {
        content_score: number;
        reasoning?: string[];
        improvements?: string[];
        star?: { situation?: string; task?: string; action?: string; result?: string };
    };
    context?: {
        context_score: number;
        links?: Array<{
            answer_span: string;
            resume_ref?: string;
            similarity?: number;
            explanation?: string;
        }>;
        consistency?: { contradiction: boolean; notes?: string };
    };
}

// 면접 결과 리포트 가져오기
export const getInterviewReport = async (sessionId: string) => {
    const response = await api.get(`/report/${sessionId}`);
    return response.data;
};

// 음성 지표 가져오기
export const getAudioMetrics = async (sessionId: string) => {
    const [overallRes, perQuestionRes] = await Promise.allSettled([
        api.get(`/audio-metrics/${sessionId}/overall`),
        api.get(`/audio-metrics/${sessionId}`),
    ]);

    const audioData: AudioAnalysisData = { overall: undefined, perQuestion: [] };

    if (overallRes.status === 'fulfilled' && overallRes.value.data?.ok) {
        audioData.overall = overallRes.value.data.overall;
    }

    if (perQuestionRes.status === 'fulfilled' && perQuestionRes.value.data?.ok) {
        audioData.perQuestion = perQuestionRes.value.data.rows || [];
    }

    return audioData;
};

// 영상 지표 가져오기
export const getVisualMetrics = async (sessionId: string) => {
    const response = await api.post(`/metrics/${sessionId}/finalize`, {});

    if (response.data?.ok && response.data?.aggregate) {
        return {
            overall: response.data.aggregate.overall,
            perQuestion: response.data.aggregate.perQuestion,
        } as VisualAnalysisData;
    }

    return null;
};

// 캘리브레이션 데이터 가져오기
export const getCalibrationData = async (sessionId: string) => {
    const response = await api.get(`/calibration/${sessionId}`);
    return response.data?.calibration || null;
};

// 비주얼 정규화 데이터 가져오기
export const getVisualNormalization = async (sessionId: string, overallData: any) => {
    const response = await api.post(`/calibration/${sessionId}/test/visual-normalize`, overallData);
    return response.data?.result || null;
};

// 문항별 텍스트 분석 가져오기
export const getPerQuestionTextAnalyses = async (sessionId: string) => {
    const response = await api.post(`/ai/${sessionId}/finalize-analyses`, {});
    return (response.data?.analyses as PerQuestionTextAnalysis[]) || [];
};

// 질문별 비주얼 정규화 데이터 가져오기
export const getPerQuestionVisualNormalization = async (
    sessionId: string,
    perQuestionData: Record<string, any>,
) => {
    const entries = Object.entries(perQuestionData);
    const results = await Promise.allSettled(
        entries.map(async ([qid, agg]) => {
            try {
                const response = await api.post(
                    `/calibration/${sessionId}/test/visual-normalize`,
                    agg,
                );
                return [qid, response.data?.result?.normalized || null] as const;
            } catch {
                return [qid, null] as const;
            }
        }),
    );

    const map: Record<string, any> = {};
    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const [qid, norm] = result.value;
            map[qid] = norm;
        }
    });

    return map;
};
