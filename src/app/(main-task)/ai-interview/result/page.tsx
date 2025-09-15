// result/page.tsx - 컴포넌트 기반 단순화 버전
'use client';

import { useState, useEffect } from 'react';
import { Card, Alert, Button, Spin, Space, Divider, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { api } from '@/apis/api';
import InterviewReport from '../_components/InterviewReport';

interface InterviewAnalysisResult {
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
            question?: string;
        };
    };
    overall_evaluation: string;
    recommendations: string[];
}

interface QAPair {
    question: string;
    answer: string;
}

// 영상/음성 지표 타입 정의
interface AudioAnalysisData {
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

interface VisualAnalysisData {
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

type DataSource = 'server' | 'localStorage' | 'unavailable';

// NEW: 문항별 텍스트 분석 타입(백엔드 스키마 축약)
interface ContentAnalysisRow {
    content_score: number;
    reasoning?: string[];
    improvements?: string[];
    star?: { situation?: string; task?: string; action?: string; result?: string };
}
interface ContextLink {
    answer_span: string;
    resume_ref?: string;
    similarity?: number;
    explanation?: string;
}
interface ContextAnalysisRow {
    context_score: number;
    links?: ContextLink[];
    consistency?: { contradiction: boolean; notes?: string };
}
interface PerQuestionTextAnalysis {
    questionId: string;
    content?: ContentAnalysisRow;
    context?: ContextAnalysisRow;
}

export default function AiInterviewResultPage() {
    const [analysisResult, setAnalysisResult] = useState<InterviewAnalysisResult | null>(null);
    const [qaList, setQaList] = useState<QAPair[]>([]);
    const [audioData, setAudioData] = useState<AudioAnalysisData | null>(null);
    const [visualData, setVisualData] = useState<VisualAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<DataSource>('server');
    const [sessionId, setSessionId] = useState<string | null>(null);
    // 캘리브레이션 및 정규화 비교용 상태
    const [calibration, setCalibration] = useState<any | null>(null);
    const [visualNormalizedOverall, setVisualNormalizedOverall] = useState<any | null>(null);
    const [visualDeviation, setVisualDeviation] = useState<number | null>(null);
    const [audioNormalizedRatios, setAudioNormalizedRatios] = useState<Record<string, number> | null>(null);
    const [visualNormalizedPerQuestion, setVisualNormalizedPerQuestion] = useState<Record<string, any> | null>(null);
    const [audioNormalizedRatiosPerQuestion, setAudioNormalizedRatiosPerQuestion] = useState<Record<string, Record<string, number>> | null>(null);
    const [visualServerQuestionScores, setVisualServerQuestionScores] = useState<Record<string, { score: number; calibrationApplied?: boolean }> | null>(null);
    // NEW: 문항별 텍스트 분석
    const [perQuestionTextAnalyses, setPerQuestionTextAnalyses] = useState<PerQuestionTextAnalysis[] | null>(null);

    useEffect(() => {
        loadInterviewResult();
    }, []);

    const loadInterviewResult = async () => {
        try {
            setLoading(true);

            // 1. 세션 ID 확인
            const storedSessionId = localStorage.getItem('aiInterviewSessionId');
            if (!storedSessionId) {
                throw new Error('면접 세션을 찾을 수 없습니다.');
            }
            setSessionId(storedSessionId);
            let reportLoadedFromServer = false;

            // 2. QA 데이터 로드 (표시용)
            try {
                const storedQA = localStorage.getItem('interviewQA');
                if (storedQA) {
                    setQaList(JSON.parse(storedQA));
                }
            } catch (e) {
                console.warn('QA 데이터 로드 실패:', e);
            }

            // 3. 서버에서 리포트 가져오기 (최우선)
            try {
                const response = await api.get(`/report/${storedSessionId}`);
                if (response.data?.success && response.data?.data) {
                    const report = response.data.data;
                    setAnalysisResult(report);
                    // audio_summary를 우선 반영하여 폴백 없이 점수 표시
                    try {
                        const s = report?.audio_summary;
                        if (s) {
                            const audioOverall: any = {
                                tone_score: Number(s.toneScore) || undefined,
                                vibrato_score: Number(s.vibratoScore) || undefined,
                                pace_score: Number(s.paceScore) || undefined,
                                overall_voice_score: Number(s.overallScore10) * 10 || undefined,
                                // 평균 특성값(있으면 표시용)
                                ...(s.averages || {}),
                            };
                            const perQRaw = Array.isArray(s.questionScores)
                                ? (s.questionScores as Array<any>).map((q: any, idx: number) => ({
                                      questionNumber: Number(q?.questionId) || idx + 1,
                                      question: qaList[idx]?.question || `질문 ${idx + 1}`,
                                      normalized_score: typeof q.score === 'number' ? q.score : undefined,
                                      calibrationApplied: !!q.calibrationApplied,
                                  }))
                                : [];
                            const perQ = normalizeAudioPerQuestion(perQRaw, qaList.length || undefined);
                            setAudioData({ overall: audioOverall, perQuestion: perQ });
                        }
                    } catch {}
                    // visual_summary 반영: confidence/behavior 점수 제공 + overall 집계 포함 시 사용
                    try {
                        const vs = report?.visual_summary;
                        if (vs) {
                            const overall: any = { ...(vs.overall || {}) };
                            if (typeof vs.confidenceScore === 'number')
                                overall.confidence_score = vs.confidenceScore;
                            if (typeof vs.behaviorScore === 'number')
                                overall.behavior_score = vs.behaviorScore;
                            const vpack = { overall, perQuestion: undefined } as VisualAnalysisData;
                            setVisualData((prev) => enrichVisualScores(mergeVisualData(prev, vpack)));
                            if (Array.isArray(vs.questionScores)) {
                                const map: Record<string, { score: number; calibrationApplied?: boolean }> = {};
                                for (const q of vs.questionScores) {
                                    if (q?.questionId) {
                                        map[q.questionId] = { score: Math.round(Number(q.score) || 0), calibrationApplied: !!q.calibrationApplied };
                                    }
                                }
                                setVisualServerQuestionScores(map);
                            }
                        }
                    } catch {}
                    setDataSource('server');
                    reportLoadedFromServer = true;
                    console.log('✅ 서버에서 리포트 로드 성공');

                    // 서버 리포트를 권위 소스로 사용하는 경우에도, per-question 비주얼 지표는 서버 finalize에서 가져와 표시
                    try {
                        const visualRes2 = await api.post(`/metrics/${storedSessionId}/finalize`, {});
                        if (visualRes2.data?.ok && visualRes2.data?.aggregate) {
                            const rawPack2 = {
                                overall: visualRes2.data.aggregate.overall,
                                perQuestion: visualRes2.data.aggregate.perQuestion,
                            } as VisualAnalysisData;
                            setVisualData(enrichVisualScores(sanitizeVisualPack(rawPack2)));
                        }
                    } catch (e) {
                        console.warn('비주얼 지표 최종 집계 로드 실패(서버 리포트 경로):', e);
                    }
                } else {
                    throw new Error('서버 리포트 데이터가 유효하지 않습니다.');
                }
            } catch (serverError: any) {
                console.warn(
                    '서버 리포트 로드 실패:',
                    serverError.response?.data || serverError.message,
                );

                // 4. localStorage 폴백
                try {
                    const storedAnalysis = localStorage.getItem('interviewAnalysis');
                    if (storedAnalysis) {
                        const analysis = JSON.parse(storedAnalysis);
                        if (analysis && !analysis.error) {
                            setAnalysisResult(analysis);
                            setDataSource('localStorage');
                            console.log('⚠️ localStorage에서 폴백 리포트 로드');
                        } else {
                            throw new Error('저장된 분석 결과가 유효하지 않습니다.');
                        }
                    } else {
                        throw new Error('저장된 분석 결과를 찾을 수 없습니다.');
                    }
                } catch (localError) {
                    console.warn('localStorage 리포트 로드 실패:', localError);
                    throw new Error('면접 결과를 불러올 수 없습니다.');
                }
            }

            // 5. 음성/영상 지표 로드 (URL 파라미터가 있으면 서버에서 직접 가져오기)
            const urlParams = new URLSearchParams(window.location.search);
            const urlSessionId = urlParams.get('sessionId');

            if (urlSessionId) {
                // URL에서 온 경우: 서버에서 직접 지표 로드
                try {
                    // 음성 지표 로드
                    const audioRes = await api.get(`/audio-metrics/${urlSessionId}/overall`);
                    if (audioRes.data?.ok && audioRes.data?.overall) {
                        const audioOverall = audioRes.data.overall;

                        // 문항별 음성 지표도 로드
                        let audioPerQuestion = [] as any[];
                        try {
                            const audioPerQRes = await api.get(`/audio-metrics/${urlSessionId}`);
                            if (audioPerQRes.data?.ok && audioPerQRes.data?.rows) {
                                audioPerQuestion = audioPerQRes.data.rows;
                            }
                        } catch (e) {
                            console.warn('문항별 음성 지표 로드 실패:', e);
                        }

                        const nextPack = { overall: audioOverall, perQuestion: audioPerQuestion };
                        setAudioData((prev) => mergeAudioData(prev, nextPack));
                        console.log('✅ 서버에서 음성 지표 로드 성공');
                    }
                } catch (e) {
                    console.warn('서버 음성 지표 로드 실패:', e);
                }

                try {
                    // 영상 지표 로드
                    const visualRes = await api.post(`/metrics/${urlSessionId}/finalize`, {});
                    if (visualRes.data?.ok && visualRes.data?.aggregate) {
                        const rawPack = {
                            overall: visualRes.data.aggregate.overall,
                            perQuestion: visualRes.data.aggregate.perQuestion,
                        } as VisualAnalysisData;
                        setVisualData(enrichVisualScores(sanitizeVisualPack(rawPack)));
                        console.log('✅ 서버에서 영상 지표 로드 성공');
                    }
                } catch (e) {
                    console.warn('서버 영상 지표 로드 실패:', e);
                }
            } else {
                // 결과 페이지(쿼리 파라미터 없음): 서버 리포트를 권위 소스로 사용
                // 서버 리포트 실패 시에만 localStorage 폴백
                if (!reportLoadedFromServer) {
                // localStorage에서 로드 (기존 로직)
                try {
                    // 서버 음성 지표 시도
                    const serverAudioOverall = localStorage.getItem('interviewAudioOverallServer');
                    const serverAudioPerQuestion = localStorage.getItem(
                        'interviewAudioPerQuestionServer',
                    );

                    if (serverAudioOverall) {
                        const audioOverall = JSON.parse(serverAudioOverall);
                        let audioPerQuestion = [] as any[];

                        if (serverAudioPerQuestion) {
                            audioPerQuestion = sanitizeAudioRows(JSON.parse(serverAudioPerQuestion));
                        }

                        const nextPack = { overall: audioOverall, perQuestion: audioPerQuestion };
                        setAudioData((prev) => mergeAudioData(prev, nextPack));
                        console.log('✅ localStorage 서버 음성 지표 로드 성공');
                    } else {
                        // 클라이언트 계산 음성 지표 폴백
                        const clientAudioOverall = localStorage.getItem('interviewAudioOverall');
                        const clientAudioPerQuestion = localStorage.getItem(
                            'interviewAudioPerQuestion',
                        );

                        if (clientAudioOverall) {
                            const audioOverall = JSON.parse(clientAudioOverall);
                            let audioPerQuestion = [];

                            if (clientAudioPerQuestion) {
                                const clientData = JSON.parse(clientAudioPerQuestion);
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

                            const nextPack = {
                                overall: {
                                    ...audioOverall,
                                    // 클라이언트 데이터에 점수 추가 (기본값)
                                    tone_score: 75,
                                    vibrato_score: 75,
                                    pace_score: 75,
                                    overall_voice_score: 75,
                                },
                                perQuestion: audioPerQuestion,
                            } as any;
                            setAudioData((prev) => mergeAudioData(prev, nextPack));
                            console.log('⚠️ 클라이언트 음성 지표로 폴백');
                        }
                    }
                } catch (e) {
                    console.warn('localStorage 음성 지표 로드 실패:', e);
                }

                try {
                    // 영상 지표 로드 (localStorage)
                    const visualOverall = localStorage.getItem('interviewVisualOverall');
                    const visualPerQuestion = localStorage.getItem('interviewVisualPerQuestion');

                    if (visualOverall) {
                        const rawPack = {
                            overall: JSON.parse(visualOverall),
                            perQuestion: visualPerQuestion ? JSON.parse(visualPerQuestion) : {},
                        } as VisualAnalysisData;
                        setVisualData(enrichVisualScores(sanitizeVisualPack(rawPack)));
                        console.log('✅ localStorage 영상 지표 로드 성공');
                    }
                } catch (e) {
                    console.warn('localStorage 영상 지표 로드 실패:', e);
                }
                }
            }
            // === 캘리브레이션 및 정규화 비교 로드 ===
            try {
                const sid = urlSessionId || storedSessionId;
                if (sid) {
                    const calibRes = await api.get(`/calibration/${sid}`);
                    if (calibRes.data?.ok) {
                        setCalibration(calibRes.data.calibration || null);
                        // 비주얼 정규화: 서버 API 이용 (overall 기준)
                        const currentVisual = visualResFromStateOrLocal();
                        const overall = currentVisual?.overall;
                        if (overall) {
                            try {
                                const visNorm = await api.post(
                                    `/calibration/${sid}/test/visual-normalize`,
                                    overall,
                                );
                                if (visNorm.data?.ok && visNorm.data?.result) {
                                    setVisualNormalizedOverall(visNorm.data.result.normalized || null);
                                    setVisualDeviation(
                                        typeof visNorm.data.result.deviationScore === 'number'
                                            ? visNorm.data.result.deviationScore
                                            : null,
                                    );
                                }
                            } catch (e) {
                                console.warn('비주얼 정규화 비교 실패:', e);
                            }
                        }
                        // 오디오 정규화: 클라이언트에서 baseline 대비 비율 계산
                        const rawAudio = audioResFromStateOrLocal();
                        const audioBaseline = calibRes.data?.calibration?.audioBaseline;
                        if (rawAudio?.overall && audioBaseline) {
                            setAudioNormalizedRatios(
                                computeAudioNormalizedRatios(rawAudio.overall, audioBaseline),
                            );
                        }
                    }
                }
            } catch (e) {
                // 서버 캘리브레이션 없음 → 로컬 비주얼 baseline으로만 가벼운 비교 가능
                const localCalib = safeParseLocalCalibration();
                if (localCalib?.visual && visualData?.overall) {
                    setCalibration({ visualBaseline: localCalib.visual });
                }
            }

            // === 캘리브레이션 및 정규화 비교 로드 ===
            try {
                const sid = urlSessionId || storedSessionId;
                if (sid) {
                    const calibRes = await api.get(`/calibration/${sid}`);
                    if (calibRes.data?.ok) {
                        setCalibration(calibRes.data.calibration || null);
                        // 비주얼 정규화: 서버 API 이용 (overall 기준)
                        const currentVisual = visualResFromStateOrLocal();
                        const overall = currentVisual?.overall;
                        if (overall) {
                            try {
                                const visNorm = await api.post(
                                    `/calibration/${sid}/test/visual-normalize`,
                                    overall,
                                );
                                if (visNorm.data?.ok && visNorm.data?.result) {
                                    setVisualNormalizedOverall(visNorm.data.result.normalized || null);
                                    setVisualDeviation(
                                        typeof visNorm.data.result.deviationScore === 'number'
                                            ? visNorm.data.result.deviationScore
                                            : null,
                                    );
                                }
                            } catch (e) {
                                console.warn('비주얼 정규화 비교 실패:', e);
                            }
                        }

                        // 오디오 정규화: 클라이언트에서 baseline 대비 비율 계산
                        const rawAudio = audioResFromStateOrLocal();
                        const audioBaseline = calibRes.data?.calibration?.audioBaseline;
                        if (rawAudio?.overall && audioBaseline) {
                            setAudioNormalizedRatios(
                                computeAudioNormalizedRatios(rawAudio.overall as any, audioBaseline as any),
                            );
                        }

                        // 오디오 per-question 정규화 비율
                        if (rawAudio?.perQuestion && Array.isArray(rawAudio.perQuestion) && audioBaseline) {
                            const per: Record<string, Record<string, number>> = {};
                            rawAudio.perQuestion.forEach((item: any, idx: number) => {
                                const features = item?.audioFeatures || item;
                                const ratios = computeAudioNormalizedRatios(features || {}, audioBaseline as any);
                                if (Object.keys(ratios).length > 0) {
                                    const key = String(item?.questionNumber || idx + 1);
                                    per[key] = ratios;
                                }
                            });
                            if (Object.keys(per).length > 0) setAudioNormalizedRatiosPerQuestion(per);
                        }

                        // 비주얼 per-question 정규화
                        const vpq = (currentVisual?.perQuestion || null) as Record<string, any> | null;
                        if (vpq && typeof vpq === 'object') {
                            try {
                                const entries = Object.entries(vpq) as Array<[string, any]>;
                                const results = await Promise.all(
                                    entries.map(async ([qid, agg]) => {
                                        try {
                                            const r = await api.post(
                                                `/calibration/${sid}/test/visual-normalize`,
                                                agg,
                                            );
                                            return [qid, r.data?.result?.normalized || null] as const;
                                        } catch {
                                            return [qid, null] as const;
                                        }
                                    }),
                                );
                                const map: Record<string, any> = {};
                                for (const [qid, norm] of results) map[qid] = norm;
                                setVisualNormalizedPerQuestion(map);
                            } catch (e) {
                                console.warn('질문별 비주얼 정규화 실패:', e);
                            }
                        }
                    }
                }
            } catch (e) {
                // 서버 캘리브레이션 없음 → 로컬 비주얼 baseline으로만 가벼운 비교 가능
                const localCalib = safeParseLocalCalibration();
                if (localCalib?.visual && visualData?.overall) {
                    setCalibration({ visualBaseline: localCalib.visual });
                }
            }
            // 6. 문항별 텍스트 분석 최종 묶음 조회(finalize-analyses)
            try {
                const faRes = await api.post(`/ai/${storedSessionId}/finalize-analyses`, {});
                const list = faRes?.data?.analyses as Array<{
                    questionId: string;
                    content?: ContentAnalysisRow;
                    context?: ContextAnalysisRow;
                }>;
                if (Array.isArray(list)) {
                    setPerQuestionTextAnalyses(list);
                }
            } catch (e) {
                console.warn('문항별 텍스트 분석 조회 실패(표시 생략):', e);
            }
        } catch (err: any) {
            console.error('리포트 로드 완전 실패:', err);
            setError(err.message || '면접 결과를 불러오는 중 오류가 발생했습니다.');
            setDataSource('unavailable');
        } finally {
            setLoading(false);
        }
    };

    // 오디오 지표 병합: 기존 값(prev)을 우선 보존하고, next에서 없는 값만 보충
    const mergeAudioData = (
        prev: AudioAnalysisData | null,
        next: AudioAnalysisData | null,
    ): AudioAnalysisData | null => {
        if (!prev) return next;
        if (!next) return prev;
        const mergedOverall = {
            ...(next.overall || {}),
            ...(prev.overall || {}),
        } as any;
        // perQuestion: questionNumber/question_id를 숫자로 정규화하여 병합
        const prevArr = Array.isArray(prev.perQuestion) ? prev.perQuestion : [];
        const nextArr = Array.isArray(next.perQuestion) ? next.perQuestion : [];
        const map = new Map<number, any>();
        const toKey = (it: any, idx: number) => {
            const raw = (it?.questionNumber ?? it?.question_id ?? (idx + 1)) as any;
            const n = Number(raw);
            return Number.isFinite(n) && n > 0 ? n : idx + 1;
        };
        nextArr.forEach((it, idx) => {
            if (!it) return;
            const key = toKey(it, idx);
            map.set(key, { ...it, questionNumber: key });
        });
        prevArr.forEach((it, idx) => {
            if (!it) return;
            const key = toKey(it, idx);
            // prev는 보조 소스: 존재하는 키에만 병합하고, 새로운 키는 추가하지 않음
            if (map.has(key)) {
                map.set(key, { ...(map.get(key) || {}), ...it, questionNumber: key });
            }
        });
        const mergedPerQ = Array.from(map.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([_, v]) => v);
        return { overall: mergedOverall, perQuestion: mergedPerQ };
    };

    // 비주얼 데이터 병합: next 우선(overall 구조), prev의 점수 필드는 보존
    const mergeVisualData = (
        prev: VisualAnalysisData | null,
        next: VisualAnalysisData | null,
    ): VisualAnalysisData | null => {
        if (!prev) return next;
        if (!next) return prev;
        const mergedOverall: any = {
            ...(prev.overall || {}),
            ...(next.overall || {}),
        };
        // 점수 필드 명시 보존/갱신
        if ((next.overall as any)?.confidence_score != null)
            mergedOverall.confidence_score = (next.overall as any).confidence_score;
        if ((next.overall as any)?.behavior_score != null)
            mergedOverall.behavior_score = (next.overall as any).behavior_score;
        // perQuestion: 객체 키를 숫자 문자열로 정규화 후 병합
        const norm = (obj?: Record<string, any> | null) => {
            const src = obj || {};
            const out: Record<string, any> = {};
            for (const [k, v] of Object.entries(src)) {
                const n = Number(k);
                const key = Number.isFinite(n) && n > 0 ? String(n) : String(k);
                out[key] = v;
            }
            return out;
        };
        const a = norm(next.perQuestion as any);
        const b = norm(prev.perQuestion as any);
        // 숫자 키만 유지하고, next(권위 소스)에 없는 키는 버림
        const perQ: Record<string, any> = { ...a };
        for (const k of Object.keys(b)) if (perQ[k]) perQ[k] = { ...b[k], ...perQ[k] };
        return { overall: mergedOverall, perQuestion: perQ };
    };

    // 시각 지표 perQuestion 정규화(숫자 키만 유지)
    const sanitizeVisualPack = (pack: VisualAnalysisData | null): VisualAnalysisData | null => {
        if (!pack?.perQuestion) return pack;
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(pack.perQuestion as Record<string, any>)) {
            const n = Number(k);
            if (Number.isFinite(n) && n > 0) out[String(n)] = v;
        }
        return { ...pack, perQuestion: out } as VisualAnalysisData;
    };

    // 최신 visual/audio 상태를 안전하게 캡처하기 위한 헬퍼들
    const visualResFromStateOrLocal = (): VisualAnalysisData | null => {
        try {
            if (visualData?.overall) return visualData;
            const visualOverall = localStorage.getItem('interviewVisualOverall');
            const visualPerQuestion = localStorage.getItem('interviewVisualPerQuestion');
            if (visualOverall) {
                return {
                    overall: JSON.parse(visualOverall),
                    perQuestion: visualPerQuestion ? JSON.parse(visualPerQuestion) : {},
                } as VisualAnalysisData;
            }
        } catch {}
        return null;
    };

    const audioResFromStateOrLocal = (): AudioAnalysisData | null => {
        try {
            if (audioData?.overall) return audioData;
            const serverAudioOverall = localStorage.getItem('interviewAudioOverallServer');
            const serverAudioPerQuestion = localStorage.getItem('interviewAudioPerQuestionServer');
            if (serverAudioOverall) {
                return {
                    overall: JSON.parse(serverAudioOverall),
                    perQuestion: serverAudioPerQuestion ? JSON.parse(serverAudioPerQuestion) : [],
                } as AudioAnalysisData;
            }
        } catch {}
        return null;
    };

    const safeParseLocalCalibration = () => {
        try {
            const raw = localStorage.getItem('aiInterviewCalibration');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    const computeAudioNormalizedRatios = (
        rawOverall: Record<string, any>,
        baseline: Record<string, any>,
    ): Record<string, number> => {
        const keys = ['f0_mean', 'f0_std', 'rms_cv', 'jitter_like', 'shimmer_like', 'silence_ratio'];
        const out: Record<string, number> = {};
        for (const k of keys) {
            const v = Number((rawOverall as any)?.[k]);
            const b = Number((baseline as any)?.[k]);
            if (Number.isFinite(v) && Number.isFinite(b) && b !== 0) {
                out[k] = v / b;
            }
        }
        return out;
    };

    // 오디오 perQuestion 정규화/중복 제거: 숫자 키만 유지하고 qaLength 초과 항목은 제거
    const normalizeAudioPerQuestion = (
        arr: any[] | null | undefined,
        qaLength?: number,
    ): any[] => {
        const list = Array.isArray(arr) ? arr : [];
        const map = new Map<number, any>();
        for (let i = 0; i < list.length; i++) {
            const it = list[i];
            const n = Number(it?.questionNumber ?? it?.question_id ?? i + 1);
            if (!Number.isFinite(n) || n <= 0) continue; // 숫자가 아닌 키(q1 등) 제거
            if (!map.has(n)) map.set(n, { ...it, questionNumber: n, question: it?.question || `질문 ${n}` });
        }
        let out = Array.from(map.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([_, v]) => v);
        if (qaLength && qaLength > 0) out = out.slice(0, qaLength);
        return out;
    };

    // 서버에서 받은 audio_metrics rows 정리(숫자 question_id만 유지)
    const sanitizeAudioRows = (rows: any[]): any[] => {
        if (!Array.isArray(rows)) return [];
        return rows
            .filter((r) => Number.isFinite(Number(r?.question_id)) && Number(r?.question_id) > 0)
            .map((r, idx) => ({ ...r, questionNumber: Number(r.question_id) || idx + 1 }));
    };

    const fmt = (n: any, digits = 3) => {
        if (n == null || Number.isNaN(Number(n))) return '-';
        const num = Number(n);
        if (!Number.isFinite(num)) return '-';
        return Number(num.toFixed(digits));
    };

    // 비주얼 점수 폴백 계산: confidence_score/behavior_score가 없을 때 채워넣음
    const enrichVisualScores = (
        pack: VisualAnalysisData | null,
    ): VisualAnalysisData | null => {
        if (!pack?.overall) return pack;
        const o: any = { ...(pack.overall as any) };
        if (o.confidence_score == null && typeof o.confidence_mean === 'number') {
            o.confidence_score = Math.max(0, Math.min(100, Math.round(o.confidence_mean * 100)));
        }
        if (o.behavior_score == null) {
            const count = Number(o.count) || 0;
            const smile = typeof o.smile_mean === 'number' ? o.smile_mean : 0;
            const presGood = Number(o.presence_dist?.good) || 0;
            const warn = Number(o.level_dist?.warning) || 0;
            const crit = Number(o.level_dist?.critical) || 0;
            const goodRatio = count > 0 ? presGood / count : 0;
            const alertRatio = count > 0 ? (warn + crit) / count : 0;
            const score01 = Math.max(
                0,
                Math.min(1, 0.6 * smile + 0.25 * goodRatio + 0.15 * (1 - alertRatio)),
            );
            o.behavior_score = Math.round(score01 * 100);
        }
        return { ...pack, overall: o } as VisualAnalysisData;
    };

    // 로딩 상태
    if (loading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
                <div className='text-center'>
                    <Spin size='large' />
                    <div className='mt-4 text-lg text-gray-600'>면접 결과를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error || !analysisResult) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
                <Card className='max-w-md mx-auto'>
                    <Alert
                        message='결과 로드 실패'
                        description={error || '면접 결과를 찾을 수 없습니다.'}
                        type='error'
                        showIcon
                        className='mb-4'
                    />
                    <div className='text-center'>
                        <Space>
                            <Link href='/ai-interview'>
                                <Button type='primary'>메인으로 돌아가기</Button>
                            </Link>
                            <Link href='/ai-interview/select'>
                                <Button>다시 면접하기</Button>
                            </Link>
                        </Space>
                    </div>
                </Card>
            </div>
        );
    }

    // 성공 상태: 리포트 컴포넌트 렌더링
    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
            <div className='container mx-auto px-4'>
                {/* 데이터 소스 표시 (개발 환경에서만) */}
                {process.env.NODE_ENV === 'development' && (
                    <Alert
                        message={`데이터 소스: ${dataSource === 'server' ? '서버' : dataSource === 'localStorage' ? '로컬 캐시' : '불가능'}`}
                        type={dataSource === 'server' ? 'success' : 'warning'}
                        className='mb-4'
                        showIcon
                    />
                )}

                {/* 캘리브레이션 비교 블록 */}
                <Card className='!border-0 !shadow-lg mb-6' title='캘리브레이션 비교'>
                    {!calibration ? (
                        <Alert type='info' message='이 세션에는 저장된 캘리브레이션이 없습니다.' />
                    ) : (
                        <div className='space-y-6'>
                            {/* 비주얼 비교 */}
                            <div>
                                <div className='flex items-center justify-between mb-2'>
                                    <div className='font-semibold'>비주얼 (시선/자신감/미소)</div>
                                    {typeof visualDeviation === 'number' && (
                                        <Tag color={visualDeviation < 0.3 ? 'green' : visualDeviation < 0.6 ? 'orange' : 'red'}>
                                            편차 {fmt(visualDeviation, 2)}
                                        </Tag>
                                    )}
                                </div>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                    <Card size='small'>
                                        <div className='text-gray-500 text-sm mb-1'>Baseline</div>
                                        <div className='text-sm'>confidence_mean: {fmt((calibration as any)?.visualBaseline?.confidence_mean ?? (calibration as any)?.visualBaseline?.overall?.confidence_mean)}</div>
                                        <div className='text-sm'>smile_mean: {fmt((calibration as any)?.visualBaseline?.smile_mean ?? (calibration as any)?.visualBaseline?.overall?.smile_mean)}</div>
                                    </Card>
                                    <Card size='small'>
                                        <div className='text-gray-500 text-sm mb-1'>Session Raw</div>
                                        <div className='text-sm'>confidence_mean: {fmt(visualData?.overall?.confidence_mean)}</div>
                                        <div className='text-sm'>smile_mean: {fmt(visualData?.overall?.smile_mean)}</div>
                                    </Card>
                                    <Card size='small'>
                                        <div className='text-gray-500 text-sm mb-1'>Calibrated</div>
                                        <div className='text-sm'>confidence_mean: {fmt(visualNormalizedOverall?.confidence_mean)}</div>
                                        <div className='text-sm'>smile_mean: {fmt(visualNormalizedOverall?.smile_mean)}</div>
                                    </Card>
                                </div>
                            </div>

                            <Divider className='!my-2' />

                            {/* 오디오 비교 */}
                            <div>
                                <div className='font-semibold mb-2'>오디오 (피치/변동/지터/쉬머/무음)</div>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                    <Card size='small'>
                                        <div className='text-gray-500 text-sm mb-1'>Baseline</div>
                                        <div className='text-sm'>f0_mean: {fmt((calibration as any)?.audioBaseline?.f0_mean)}</div>
                                        <div className='text-sm'>f0_std: {fmt((calibration as any)?.audioBaseline?.f0_std)}</div>
                                        <div className='text-sm'>rms_cv: {fmt((calibration as any)?.audioBaseline?.rms_cv)}</div>
                                        <div className='text-sm'>jitter_like: {fmt((calibration as any)?.audioBaseline?.jitter_like)}</div>
                                        <div className='text-sm'>shimmer_like: {fmt((calibration as any)?.audioBaseline?.shimmer_like)}</div>
                                        <div className='text-sm'>silence_ratio: {fmt((calibration as any)?.audioBaseline?.silence_ratio)}</div>
                                    </Card>
                                    <Card size='small'>
                                        <div className='text-gray-500 text-sm mb-1'>Session Raw</div>
                                        <div className='text-sm'>f0_mean: {fmt(audioData?.overall?.f0_mean)}</div>
                                        <div className='text-sm'>f0_std: {fmt(audioData?.overall?.f0_std)}</div>
                                        <div className='text-sm'>rms_cv: {fmt(audioData?.overall?.rms_cv)}</div>
                                        <div className='text-sm'>jitter_like: {fmt(audioData?.overall?.jitter_like)}</div>
                                        <div className='text-sm'>shimmer_like: {fmt(audioData?.overall?.shimmer_like)}</div>
                                        <div className='text-sm'>silence_ratio: {fmt(audioData?.overall?.silence_ratio)}</div>
                                    </Card>
                                    <Card size='small'>
                                        <div className='text-gray-500 text-sm mb-1'>Ratio (raw / baseline)</div>
                                        <div className='text-sm'>f0_mean: {fmt(audioNormalizedRatios?.f0_mean)}</div>
                                        <div className='text-sm'>f0_std: {fmt(audioNormalizedRatios?.f0_std)}</div>
                                        <div className='text-sm'>rms_cv: {fmt(audioNormalizedRatios?.rms_cv)}</div>
                                        <div className='text-sm'>jitter_like: {fmt(audioNormalizedRatios?.jitter_like)}</div>
                                        <div className='text-sm'>shimmer_like: {fmt(audioNormalizedRatios?.shimmer_like)}</div>
                                        <div className='text-sm'>silence_ratio: {fmt(audioNormalizedRatios?.silence_ratio)}</div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* 리포트 컴포넌트 */}
                <InterviewReport
                    analysisResult={analysisResult}
                    qaList={qaList}
                    audioData={audioData || undefined}
                    visualData={visualData || undefined}
                    perQuestionTextAnalyses={perQuestionTextAnalyses || undefined}
                    sessionMeta={{
                        sessionId: sessionId || 'unknown',
                        createdAt: new Date().toISOString(), // 실제로는 서버에서 제공
                    }}
                    displayOptions={{
                        showHeader: true,
                        showActions: true,
                        showDetailedFeedback: true,
                        showAudioAnalysis: true,
                        showVisualAnalysis: true,
                        compact: false,
                    }}
                    viewMode={'compare'}
                    calibrationCompare={{
                        visual: {
                            baseline: (calibration as any)?.visualBaseline || (calibration as any)?.visualBaseline?.overall || undefined,
                            normalizedOverall: visualNormalizedOverall || undefined,
                            normalizedPerQuestion: visualNormalizedPerQuestion || undefined,
                            serverQuestionScores: visualServerQuestionScores || undefined,
                        },
                        audio: {
                            baseline: (calibration as any)?.audioBaseline || undefined,
                            ratiosOverall: audioNormalizedRatios || undefined,
                            ratiosPerQuestion: audioNormalizedRatiosPerQuestion || undefined,
                        },
                    }}
                />

                {/* 액션 버튼 */}
                <div className='text-center mt-8'>
                    <Space size='large'>
                        <Link href='/ai-interview'>
                            <Button size='large' icon={<ArrowLeftOutlined />}>
                                메인으로 돌아가기
                            </Button>
                        </Link>
                        <Link href='/ai-interview/select'>
                            <Button type='primary' size='large'>
                                다시 면접하기
                            </Button>
                        </Link>
                    </Space>
                </div>
            </div>
        </div>
    );
}
