// result/_hooks/useInterviewResult.ts
import { useState, useEffect } from 'react';
import type { InterviewAnalysisResult } from '@/types/report';
import type {
    AudioAnalysisData,
    VisualAnalysisData,
    PerQuestionTextAnalysis,
} from '../_apis/result-api';
import {
    getInterviewReport,
    getAudioMetrics,
    getVisualMetrics,
    getCalibrationData,
    getPerQuestionTextAnalyses,
    getPerQuestionVisualNormalization,
    getVisualNormalization,
} from '../_apis/result-api';
import {
    mergeAudioData,
    mergeVisualData,
    sanitizeVisualPack,
    enrichVisualScores,
    normalizeAudioPerQuestion,
    sanitizeAudioRows,
    computeAudioNormalizedRatios,
} from '../_utils/data-processing';
import {
    loadQAFromStorage,
    loadAnalysisFromStorage,
    loadServerAudioFromStorage,
    loadClientAudioFromStorage,
    loadVisualFromStorage,
    loadLocalCalibration,
    loadSessionId,
} from '../_utils/local-storage';

interface QAPair {
    question: string;
    answer: string;
}

type DataSource = 'server' | 'localStorage' | 'unavailable';

export const useInterviewResult = () => {
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
    const [audioNormalizedRatios, setAudioNormalizedRatios] = useState<Record<
        string,
        number
    > | null>(null);
    const [visualNormalizedPerQuestion, setVisualNormalizedPerQuestion] = useState<Record<
        string,
        any
    > | null>(null);
    const [audioNormalizedRatiosPerQuestion, setAudioNormalizedRatiosPerQuestion] = useState<Record<
        string,
        Record<string, number>
    > | null>(null);
    const [visualServerQuestionScores, setVisualServerQuestionScores] = useState<Record<
        string,
        { score: number; calibrationApplied?: boolean }
    > | null>(null);

    // 문항별 텍스트 분석
    const [perQuestionTextAnalyses, setPerQuestionTextAnalyses] = useState<
        PerQuestionTextAnalysis[] | null
    >(null);

    const loadInterviewResult = async () => {
        try {
            setLoading(true);

            // 1. 세션 ID 확인
            const storedSessionId = loadSessionId();
            if (!storedSessionId) {
                throw new Error('면접 세션을 찾을 수 없습니다.');
            }
            setSessionId(storedSessionId);
            let reportLoadedFromServer = false;

            // 2. QA 데이터 로드 (표시용)
            try {
                const storedQA = loadQAFromStorage();
                if (storedQA) {
                    setQaList(storedQA);
                }
            } catch (e) {
                console.warn('QA 데이터 로드 실패:', e);
            }

            // 3. 서버에서 리포트 가져오기 (최우선)
            try {
                const report = await getInterviewReport(storedSessionId);
                if (report?.success && report?.data) {
                    setAnalysisResult(report.data);

                    // audio_summary를 우선 반영하여 폴백 없이 점수 표시
                    try {
                        const s = report.data?.audio_summary;
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
                                      normalized_score:
                                          typeof q.score === 'number' ? q.score : undefined,
                                      calibrationApplied: !!q.calibrationApplied,
                                  }))
                                : [];
                            const perQ = normalizeAudioPerQuestion(
                                perQRaw,
                                qaList.length || undefined,
                            );
                            setAudioData({ overall: audioOverall, perQuestion: perQ });
                        }
                    } catch {}

                    // visual_summary 반영: confidence/behavior 점수 제공 + overall 집계 포함 시 사용
                    try {
                        const vs = report.data?.visual_summary;
                        if (vs) {
                            const overall: any = { ...(vs.overall || {}) };
                            if (typeof vs.confidenceScore === 'number')
                                overall.confidence_score = vs.confidenceScore;
                            if (typeof vs.behaviorScore === 'number')
                                overall.behavior_score = vs.behaviorScore;
                            const vpack = { overall, perQuestion: undefined } as VisualAnalysisData;
                            setVisualData((prev) =>
                                enrichVisualScores(mergeVisualData(prev, vpack)),
                            );
                            if (Array.isArray(vs.questionScores)) {
                                const map: Record<
                                    string,
                                    { score: number; calibrationApplied?: boolean }
                                > = {};
                                for (const q of vs.questionScores) {
                                    if (q?.questionId) {
                                        map[q.questionId] = {
                                            score: Math.round(Number(q.score) || 0),
                                            calibrationApplied: !!q.calibrationApplied,
                                        };
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
                        const visualData = await getVisualMetrics(storedSessionId);
                        if (visualData) {
                            setVisualData(enrichVisualScores(sanitizeVisualPack(visualData)));
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
                    const storedAnalysis = loadAnalysisFromStorage();
                    if (storedAnalysis && !storedAnalysis.error) {
                        setAnalysisResult(storedAnalysis);
                        setDataSource('localStorage');
                        console.log('⚠️ localStorage에서 폴백 리포트 로드');
                    } else {
                        throw new Error('저장된 분석 결과가 유효하지 않습니다.');
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
                    const audioData = await getAudioMetrics(urlSessionId);
                    if (audioData.overall) {
                        setAudioData((prev) => mergeAudioData(prev, audioData));
                        console.log('✅ 서버에서 음성 지표 로드 성공');
                    }
                } catch (e) {
                    console.warn('서버 음성 지표 로드 실패:', e);
                }

                try {
                    const visualData = await getVisualMetrics(urlSessionId);
                    if (visualData) {
                        setVisualData(enrichVisualScores(sanitizeVisualPack(visualData)));
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
                        const serverAudioData = loadServerAudioFromStorage();
                        if (serverAudioData) {
                            setAudioData((prev) => mergeAudioData(prev, serverAudioData));
                            console.log('✅ localStorage 서버 음성 지표 로드 성공');
                        } else {
                            // 클라이언트 계산 음성 지표 폴백
                            const clientAudioData = loadClientAudioFromStorage();
                            if (clientAudioData) {
                                setAudioData((prev) => mergeAudioData(prev, clientAudioData));
                                console.log('⚠️ 클라이언트 음성 지표로 폴백');
                            }
                        }
                    } catch (e) {
                        console.warn('localStorage 음성 지표 로드 실패:', e);
                    }

                    try {
                        const visualData = loadVisualFromStorage();
                        if (visualData) {
                            setVisualData(enrichVisualScores(sanitizeVisualPack(visualData)));
                            console.log('✅ localStorage 영상 지표 로드 성공');
                        }
                    } catch (e) {
                        console.warn('localStorage 영상 지표 로드 실패:', e);
                    }
                }
            }

            // 6. 캘리브레이션 및 정규화 비교 로드
            try {
                const sid = urlSessionId || storedSessionId;
                if (sid) {
                    const calibData = await getCalibrationData(sid);
                    if (calibData) {
                        setCalibration(calibData);

                        // 비주얼 정규화: 서버 API 이용 (overall 기준)
                        const currentVisual = visualData?.overall;
                        if (currentVisual) {
                            try {
                                const visNorm = await getVisualNormalization(sid, currentVisual);
                                if (visNorm) {
                                    setVisualNormalizedOverall(visNorm.normalized || null);
                                    setVisualDeviation(
                                        typeof visNorm.deviationScore === 'number'
                                            ? visNorm.deviationScore
                                            : null,
                                    );
                                }
                            } catch (e) {
                                console.warn('비주얼 정규화 비교 실패:', e);
                            }
                        }

                        // 오디오 정규화: 클라이언트에서 baseline 대비 비율 계산
                        const rawAudio = audioData?.overall;
                        const audioBaseline = calibData?.audioBaseline;
                        if (rawAudio && audioBaseline) {
                            setAudioNormalizedRatios(
                                computeAudioNormalizedRatios(rawAudio, audioBaseline),
                            );
                        }

                        // 오디오 per-question 정규화 비율
                        if (
                            audioData?.perQuestion &&
                            Array.isArray(audioData.perQuestion) &&
                            audioBaseline
                        ) {
                            const per: Record<string, Record<string, number>> = {};
                            audioData.perQuestion.forEach((item: any, idx: number) => {
                                const features = item?.audioFeatures || item;
                                const ratios = computeAudioNormalizedRatios(
                                    features || {},
                                    audioBaseline,
                                );
                                if (Object.keys(ratios).length > 0) {
                                    const key = String(item?.questionNumber || idx + 1);
                                    per[key] = ratios;
                                }
                            });
                            if (Object.keys(per).length > 0)
                                setAudioNormalizedRatiosPerQuestion(per);
                        }

                        // 비주얼 per-question 정규화
                        const vpq = (visualData?.perQuestion || null) as Record<string, any> | null;
                        if (vpq && typeof vpq === 'object') {
                            try {
                                const normalizedPerQuestion =
                                    await getPerQuestionVisualNormalization(sid, vpq);
                                setVisualNormalizedPerQuestion(normalizedPerQuestion);
                            } catch (e) {
                                console.warn('질문별 비주얼 정규화 실패:', e);
                            }
                        }
                    }
                }
            } catch (e) {
                // 서버 캘리브레이션 없음 → 로컬 비주얼 baseline으로만 가벼운 비교 가능
                const localCalib = loadLocalCalibration();
                if (localCalib?.visual && visualData?.overall) {
                    setCalibration({ visualBaseline: localCalib.visual });
                }
            }

            // 7. 문항별 텍스트 분석 최종 묶음 조회(finalize-analyses)
            try {
                const analyses = await getPerQuestionTextAnalyses(storedSessionId);
                if (Array.isArray(analyses)) {
                    setPerQuestionTextAnalyses(analyses);
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

    useEffect(() => {
        loadInterviewResult();
    }, []);

    return {
        analysisResult,
        qaList,
        audioData,
        visualData,
        loading,
        error,
        dataSource,
        sessionId,
        calibration,
        visualNormalizedOverall,
        visualDeviation,
        audioNormalizedRatios,
        visualNormalizedPerQuestion,
        audioNormalizedRatiosPerQuestion,
        visualServerQuestionScores,
        perQuestionTextAnalyses,
        refetch: loadInterviewResult,
    };
};
