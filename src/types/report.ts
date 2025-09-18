// Shared report types matching backend schema

export type AudioQuestionScore = {
    questionId: string;
    score: number; // 0-100 normalized
    calibrationApplied: boolean;
};

export type VisualQuestionScore = {
    questionId: string;
    score: number; // 0-100 normalized
    calibrationApplied: boolean;
};

export type AudioSummary = {
    toneScore: number; // 0-100
    vibratoScore: number; // 0-100
    paceScore: number; // 0-100
    overallScore10: number; // 0-10 scale
    averages?: Record<string, any> | null; // Partial<AudioFeatures> from backend
    questionScores?: AudioQuestionScore[];
    calibrationCoverage?: number; // 0-1 ratio
};

export type VisualSummary = {
    confidenceScore: number; // 0-100
    behaviorScore: number; // 0-100
    alertRatioPercent: number; // 0-100
    overallScore10: number; // 0-10 scale
    overall?: Record<string, any> | null; // SessionVisualAggregate['overall']
    questionScores?: VisualQuestionScore[];
    calibrationCoverage?: number; // 0-1 ratio
};

export type InterviewAnalysisResult = {
    overall_score: number; // 0-100
    detailed_scores: {
        content30: number;
        context30: number;
        expression40: number;
    };
    expression_indices?: {
        confidence: number;
        clarity: number;
        engagement: number;
        composure: number;
        professionalism: number;
        consistency: number;
        reliabilityWeight?: number;
    };
    strengths?: string[];
    improvements?: string[];
    detailed_feedback?: Record<string, { score: number; feedback: string; question?: string }>;
    overall_evaluation?: string;
    recommendations?: string[];
    calibration_info?: {
        audio_calibrated: boolean;
        visual_calibrated: boolean;
        calibration_applied: boolean;
    };
    audio_summary?: AudioSummary;
    visual_summary?: VisualSummary;
    text_analysis_summary?: {
        content_avg100: number;
        context_avg100: number;
        overall_llm10: number;
        top_reasons?: string[];
        top_improvements?: string[];
    };
    evidence_links?: Array<{
        answer_span: string;
        resume_ref?: string;
        similarity?: number;
        explanation?: string;
    }>;
    // NEW: 1분 자기소개 대본
    self_intro_script?: string;
};
