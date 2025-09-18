// result/_utils/local-storage.ts
import type { AudioAnalysisData, VisualAnalysisData } from '../_apis/result-api';

// localStorage에서 데이터를 안전하게 파싱하는 유틸리티
export const safeParseJSON = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return defaultValue;
        return JSON.parse(item);
    } catch {
        return defaultValue;
    }
};

// 면접 QA 데이터 로드
export const loadQAFromStorage = () => {
    return safeParseJSON('interviewQA', []);
};

// 면접 분석 결과 로드
export const loadAnalysisFromStorage = () => {
    return safeParseJSON('interviewAnalysis', null);
};

// 서버 음성 지표 로드
export const loadServerAudioFromStorage = (): AudioAnalysisData | null => {
    const overall = localStorage.getItem('interviewAudioOverallServer');
    const perQuestion = localStorage.getItem('interviewAudioPerQuestionServer');

    if (!overall) return null;

    return {
        overall: JSON.parse(overall),
        perQuestion: perQuestion ? JSON.parse(perQuestion) : [],
    };
};

// 클라이언트 음성 지표 로드
export const loadClientAudioFromStorage = (): AudioAnalysisData | null => {
    const overall = localStorage.getItem('interviewAudioOverall');
    const perQuestion = localStorage.getItem('interviewAudioPerQuestion');

    if (!overall) return null;

    const audioOverall = JSON.parse(overall);
    let audioPerQuestion = [];

    if (perQuestion) {
        const clientData = JSON.parse(perQuestion);
        audioPerQuestion = clientData.map((item: any, index: number) => ({
            questionNumber: item.questionNumber || index + 1,
            question: item.question || `질문 ${index + 1}`,
            audioUrl: item.audioUrl,
            audioFeatures: item.audioFeatures,
            // 클라이언트 데이터에는 점수가 없으므로 기본값 사용
            tone_score: 75,
            vibrato_score: 75,
            pace_score: 75,
        }));
    }

    return {
        overall: {
            ...audioOverall,
            // 클라이언트 데이터에 점수 추가 (기본값)
            tone_score: 75,
            vibrato_score: 75,
            pace_score: 75,
            overall_voice_score: 75,
        },
        perQuestion: audioPerQuestion,
    };
};

// 영상 지표 로드
export const loadVisualFromStorage = (): VisualAnalysisData | null => {
    const overall = localStorage.getItem('interviewVisualOverall');
    const perQuestion = localStorage.getItem('interviewVisualPerQuestion');

    if (!overall) return null;

    return {
        overall: JSON.parse(overall),
        perQuestion: perQuestion ? JSON.parse(perQuestion) : {},
    };
};

// 로컬 캘리브레이션 데이터 로드
export const loadLocalCalibration = () => {
    return safeParseJSON<{ visual?: any; audio?: any } | null>('aiInterviewCalibration', null);
};

// 세션 ID 로드
export const loadSessionId = (): string | null => {
    return localStorage.getItem('aiInterviewSessionId');
};
