'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Typography,
    Progress,
    Button,
    Row,
    Col,
    Statistic,
    List,
    Tag,
    Space,
    Alert,
    Divider,
    Tooltip,
} from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    MessageOutlined,
    ArrowLeftOutlined,
    TrophyOutlined,
    StarOutlined,
    BulbOutlined,
    RiseOutlined,
    WarningOutlined,
    SoundOutlined,
    AudioOutlined,
    SmileOutlined,
    ThunderboltOutlined,
    InfoCircleOutlined,
    DownloadOutlined,
    LinkOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { api } from '@/apis/api';

const { Title, Paragraph, Text } = Typography;

// ChatGPT API 응답 형식에 맞는 타입 정의
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
        };
    };
    overall_evaluation: string;
    recommendations: string[];
}

// API 실패 시 타입
interface InterviewAnalysisError {
    error: true;
    message: string;
}

interface QAPair {
    question: string;
    answer: string;
}

// ▼ ADDED: 음성 분석 타입들
interface AudioFeatures {
    f0_mean: number;
    f0_std: number;
    f0_cv?: number;
    f0_std_semitone?: number;
    rms_std: number;
    rms_cv: number;
    rms_cv_voiced?: number;
    rms_db_std_voiced?: number;
    jitter_like: number;
    shimmer_like: number;
    silence_ratio: number;
    sr: number;
    voiced_ratio?: number;
    voiced_frames?: number;
    total_frames?: number;
    // Diagnostics
    voiced_prob_mean?: number;
    voiced_prob_median?: number;
    voiced_prob_p90?: number;
    voiced_flag_ratio?: number;
    voiced_prob_ge_025_ratio?: number;
    voiced_prob_ge_035_ratio?: number;
    f0_valid_ratio?: number;
    silence_ratio_db50?: number;
    voiced_ratio_speech?: number;
    speech_frames?: number | null;
}
interface AudioPerQuestion {
    questionNumber: number;
    question: string;
    audioFeatures?: AudioFeatures;
    audioUrl?: string;
}

// === ▼ ADDED: 영상(시각) 집계 타입들 (백엔드 응답 구조에 맞춤) ===
type PresenceKey = 'good' | 'average' | 'needs_improvement';
type LevelKey = 'ok' | 'info' | 'warning' | 'critical';
interface VisualQuestionAgg {
    count: number;
    confidence_mean: number | null;
    confidence_max: number | null;
    smile_mean: number | null;
    smile_max: number | null;
    eye_contact_mean?: number | null;
    blink_mean?: number | null;
    gaze_stability?: number | null;
    presence_dist: Record<PresenceKey, number>;
    level_dist: Record<LevelKey, number>;
    landmarks_mean?: {
        leftEye?: { x: number; y: number };
        rightEye?: { x: number; y: number };
        nose?: { x: number; y: number };
    };
    startedAt?: number;
    endedAt?: number;
}
interface VisualSessionAggOverall {
    count: number;
    confidence_mean: number | null;
    confidence_max: number | null;
    smile_mean: number | null;
    smile_max: number | null;
    eye_contact_mean?: number | null;
    blink_mean?: number | null;
    gaze_stability?: number | null;
    presence_dist: Record<PresenceKey, number>;
    level_dist: Record<LevelKey, number>;
    startedAt?: number;
    endedAt?: number;
}

export default function AiInterviewResultPage() {
    const [analysisResult, setAnalysisResult] = useState<InterviewAnalysisResult | null>(null);
    const [analysisError, setAnalysisError] = useState<InterviewAnalysisError | null>(null);
    const [qaList, setQaList] = useState<QAPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ▼ ADDED: 음성 분석 상태
    const [audioPerQuestion, setAudioPerQuestion] = useState<AudioPerQuestion[] | null>(null);
    const [audioOverall, setAudioOverall] = useState<Partial<AudioFeatures> | null>(null);

    // === ▼ ADDED: 영상(시각) 집계 상태 ===
    const [visualPerQuestion, setVisualPerQuestion] = useState<Record<
        string,
        VisualQuestionAgg
    > | null>(null);
    const [visualOverall, setVisualOverall] = useState<VisualSessionAggOverall | null>(null);
    // 상세 지표 토글 (기본 접힘)
    const [showAudioDetails, setShowAudioDetails] = useState(false);
    const [showVisualDetails, setShowVisualDetails] = useState(false);
    const [showDetailByQuestion, setShowDetailByQuestion] = useState<Record<number, boolean>>({});

    // 공유/내보내기 액션
    const handlePrint = () => {
        if (typeof window !== 'undefined') window.print();
    };
    const handleShare = async () => {
        try {
            const url = typeof window !== 'undefined' ? window.location.href : '';
            await navigator.clipboard.writeText(url);
        } catch (e) {
            // 무시: 권한 거부 등
        }
    };

    useEffect(() => {
        // localStorage에서 데이터 가져오기
        try {
            const storedAnalysis = localStorage.getItem('interviewAnalysis');
            const storedQA = localStorage.getItem('interviewQA');

            // ▼ ADDED: 음성 분석 저장본 가져오기
            const storedAudioPerQ = localStorage.getItem('interviewAudioPerQuestion');
            const storedAudioOverall = localStorage.getItem('interviewAudioOverall');

            // ▼ ADDED: 영상 분석
            const storedVisualPerQ = localStorage.getItem('interviewVisualPerQuestion');
            const storedVisualOverall = localStorage.getItem('interviewVisualOverall');

            // 폴백 생성기: API 없이도 기본 리포트 렌더
            const buildFallback = (qa: QAPair[]): InterviewAnalysisResult => ({
                overall_score: 75,
                detailed_scores: { completeness: 7, specificity: 7, logic: 7, impression: 7 },
                strengths: ['명확한 의사 전달', '안정적인 톤과 태도'],
                improvements: ['구체적 사례 추가', '핵심 요약으로 마무리'],
                detailed_feedback: Object.fromEntries(
                    (qa || []).map((_, i) => [
                        `question_${i + 1}`,
                        { score: 7, feedback: '핵심 근거를 1-2개로 정리하면 더 설득력 있습니다.' },
                    ]),
                ),
                overall_evaluation:
                    '전반적으로 안정적인 태도와 전달력을 보였습니다. 다만 일부 답변에서 구체적 사례와 수치 기반 근거가 더해지면 완성도가 높아질 것입니다.',
                recommendations: [
                    'STAR(상황-과제-행동-결과) 구조로 답변 정리',
                    '정량 지표(숫자, 성과) 1개 이상 포함',
                    '결론-근거-요약 3단 구조로 말하기 연습',
                ],
            });

            if (storedAnalysis && storedQA) {
                const analysis = JSON.parse(storedAnalysis);
                const qa = JSON.parse(storedQA);

                // API 실패 여부가 있어도 화면은 계속 렌더 (폴백 주입)
                if (analysis.error) {
                    // setAnalysisError(analysis); // 임시: 실패 화면 대신 폴백 리포트 표시
                    setAnalysisResult(buildFallback(qa));
                } else {
                    setAnalysisResult(analysis);
                }

                setQaList(qa);

                // ▼ ADDED: 음성 분석 상태 주입(없으면 null 유지)
                if (storedAudioPerQ) {
                    try {
                        setAudioPerQuestion(JSON.parse(storedAudioPerQ));
                    } catch {}
                }
                if (storedAudioOverall) {
                    try {
                        setAudioOverall(JSON.parse(storedAudioOverall));
                    } catch {}
                }

                // ▼ ADDED: 영상
                if (storedVisualPerQ) {
                    try {
                        setVisualPerQuestion(JSON.parse(storedVisualPerQ));
                    } catch {}
                }
                if (storedVisualOverall) {
                    try {
                        setVisualOverall(JSON.parse(storedVisualOverall));
                    } catch {}
                }

                setLoading(false);
            } else {
                // API와 무관하게 결과 페이지 표시를 위해 폴백 생성
                let qa: QAPair[] = [];
                try {
                    if (storedQA) qa = JSON.parse(storedQA);
                } catch {}
                setQaList(qa);
                setAnalysisResult(buildFallback(qa));
                // setError('면접 결과 데이터를 찾을 수 없습니다.'); // 메시지는 보류
                setLoading(false);
            }
        } catch (err) {
            // 오류 시에도 폴백으로 화면 표시
            setQaList([]);
            setAnalysisResult({
                overall_score: 75,
                detailed_scores: { completeness: 7, specificity: 7, logic: 7, impression: 7 },
                strengths: ['명확한 의사 전달', '안정적인 톤과 태도'],
                improvements: ['구체적 사례 추가', '핵심 요약으로 마무리'],
                detailed_feedback: {},
                overall_evaluation:
                    '전반적으로 안정적인 태도와 전달력을 보였습니다. 다만 일부 답변에서 구체적 사례와 수치 기반 근거가 더해지면 완성도가 높아질 것입니다.',
                recommendations: [
                    'STAR(상황-과제-행동-결과) 구조로 답변 정리',
                    '정량 지표(숫자, 성과) 1개 이상 포함',
                    '결론-근거-요약 3단 구조로 말하기 연습',
                ],
            });
            // setError('데이터를 불러오는 중 오류가 발생했습니다.');
            setLoading(false);
        }
    }, []);

    // 서버 저장본 동기화: 세션ID가 있으면 서버에서 리포트/집계 불러오기
    useEffect(() => {
        const sid = (() => {
            try { return localStorage.getItem('aiInterviewSessionId') || null; } catch { return null; }
        })();
        if (!sid) return;
        (async () => {
            try {
                setLoading(true);
                const [rpt, vis, aOver, aPer] = await Promise.allSettled([
                    api.get(`/report/${sid}`),
                    api.get(`/metrics/${sid}`),
                    api.get(`/audio-metrics/${sid}/overall`),
                    api.get(`/audio-metrics/${sid}`),
                ]);
                if (rpt.status === 'fulfilled' && rpt.value?.data?.success) {
                    setAnalysisResult(rpt.value.data.data);
                }
                if (vis.status === 'fulfilled' && vis.value?.data?.aggregate) {
                    const agg = vis.value.data.aggregate;
                    setVisualPerQuestion(agg.perQuestion);
                    setVisualOverall(agg.overall);
                }
                if (aOver.status === 'fulfilled' && aOver.value?.data?.overall) {
                    setAudioOverall(aOver.value.data.overall);
                }
                if (aPer.status === 'fulfilled' && aPer.value?.data?.rows) {
                    const rows = aPer.value.data.rows as any[];
                    setAudioPerQuestion(
                        rows.map((r, idx) => ({
                            questionNumber: idx + 1,
                            question: qaList[idx]?.question ?? `질문 ${idx + 1}`,
                            audioFeatures: r,
                        })),
                    );
                }
            } catch (e) {
                // ignore
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ===== 클라이언트 측 리포트 산출 (QA/Audio/Visual 기반) =====
    const countConnectors = (text: string) => {
        const connectors = [
            '그래서',
            '따라서',
            '왜냐하면',
            '때문에',
            '하지만',
            '그러나',
            '또한',
            '그리고',
            '결과적으로',
            '먼저',
            '다음으로',
            '마지막으로',
        ];
        let n = 0;
        for (const c of connectors) {
            const re = new RegExp(c, 'g');
            n += (text.match(re) || []).length;
        }
        return n;
    };
    const wordStats = (text: string) => {
        const tokens = (text || '').trim().split(/\s+/).filter(Boolean);
        const total = tokens.length;
        const unique = new Set(tokens).size;
        const longWords = tokens.filter((w) => w.length >= 4).length;
        const digitCount = ((text || '').match(/[0-9]/g) || []).length;
        return { total, unique, longWords, digitCount, connectors: countConnectors(text || '') };
    };
    const scale01 = (x: number, a: number, b: number) => {
        if (b <= a) return 0;
        const t = (x - a) / (b - a);
        return Math.max(0, Math.min(1, t));
    };
    const smileBalance01 = (v?: number | null) => {
        if (typeof v !== 'number') return 0.5;
        return 1 - Math.min(1, Math.abs(v - 0.5) / 0.5);
    };
    const videoScore10FromAgg = (v?: VisualSessionAggOverall | null) => {
        if (!v) return 6; // 중간값 폴백
        const count = v.count || 0;
        const conf = typeof v.confidence_mean === 'number' ? v.confidence_mean : 0.65; // 0~1
        const good = count ? (v.presence_dist?.good ?? 0) / count : 0;
        const smileB = smileBalance01(v.smile_mean); // 0~1
        const eye = typeof v.eye_contact_mean === 'number' ? v.eye_contact_mean : 0.6;
        const gaze = typeof v.gaze_stability === 'number' ? v.gaze_stability : 0.6;
        const warnR = count ? (v.level_dist?.warning ?? 0) / count : 0;
        const critR = count ? (v.level_dist?.critical ?? 0) / count : 0;
        // 가중치: conf 40% + presence 25% + smile balance 15% + eye contact 10% + gaze stability 10%
        const base = 0.4 * conf + 0.25 * good + 0.15 * smileB + 0.1 * eye + 0.1 * gaze; // 0~1
        const penalty = Math.min(0.4, 0.6 * warnR + 1.0 * critR); // 0~0.4
        const score01 = Math.max(0, Math.min(1, base - penalty));
        return Math.round(score01 * 10);
    };

    const computeFrontendReport = (
        qa: QAPair[],
        audioAll?: Partial<AudioFeatures> | null,
        visualAll?: VisualSessionAggOverall | null,
        audioPerQ?: AudioPerQuestion[] | null,
    ): InterviewAnalysisResult => {
        // 1) 텍스트 기반
        const stats = qa.map((q) => wordStats(q.answer || ''));
        const avgWords = stats.length ? stats.reduce((a, s) => a + s.total, 0) / stats.length : 0;
        const avgUniqueRatio = stats.length
            ? stats.reduce((a, s) => a + (s.total ? s.unique / s.total : 0), 0) / stats.length
            : 0;
        const avgConnectors = stats.length
            ? stats.reduce((a, s) => a + s.connectors, 0) / stats.length
            : 0;
        const avgDigits = stats.length
            ? stats.reduce((a, s) => a + s.digitCount, 0) / stats.length
            : 0;

        const completeness10 = Math.round(4 + scale01(avgWords, 30, 120) * 6); // 4~10
        const specificity10 = Math.round(
            Math.min(
                10,
                2 + avgDigits * 1.5 + (avgUniqueRatio || 0) * 5 + scale01(avgWords, 40, 100) * 2,
            ),
        );
        const logic10 = Math.round(
            Math.min(10, 3 + avgConnectors * 2 + scale01(avgWords, 40, 100) * 3),
        );

        // 2) 오디오/비디오 기반 인상 점수(0~10)
        const tScore =
            typeof audioAll !== 'undefined' ? toneScore(audioAll as AudioFeatures) : undefined;
        const vScore =
            typeof audioAll !== 'undefined' ? vibratoScore(audioAll as AudioFeatures) : undefined;
        const pScore =
            typeof audioAll !== 'undefined' ? paceScore(audioAll as AudioFeatures) : undefined;
        const a10 = [tScore, vScore, pScore]
            .filter((x): x is number => typeof x === 'number' && isFinite(x))
            .map((x) => x / 10);
        const audio10 = a10.length ? a10.reduce((a, b) => a + b, 0) / a10.length : 6.5;

        const visual10 = videoScore10FromAgg(visualAll);

        const impression10 = Math.round(audio10 * 0.6 + visual10 * 0.4);

        // 3) 종합 점수(0~100)
        const overall = Math.round(
            completeness10 * 2.5 + specificity10 * 2.5 + logic10 * 2.0 + impression10 * 3.0,
        );

        // 4) 강점/개선사항
        const strengths: string[] = [];
        const improvements: string[] = [];
        if (completeness10 >= 8) strengths.push('답변 길이와 구성의 균형이 좋습니다.');
        else improvements.push('핵심-근거-사례 순서로 내용을 조금 더 확장하세요.');
        if (specificity10 >= 8) strengths.push('수치·사례 등 구체적 근거가 잘 나타납니다.');
        else improvements.push('숫자(성과, 지표)나 구체 사례를 1개 이상 포함하세요.');
        if (logic10 >= 8) strengths.push('접속어 활용이 적절해 논리 전개가 매끄럽습니다.');
        else improvements.push('따라서/왜냐하면 등 연결어로 흐름을 명확히 하세요.');
        if ((tScore ?? 0) >= 80) strengths.push('목소리 톤이 안정적입니다.');
        if ((pScore ?? 0) >= 80) strengths.push('말 속도가 적정 범위입니다.');
        if (typeof visualAll?.confidence_mean === 'number' && visualAll.confidence_mean >= 0.7)
            strengths.push('자신감 있는 표정과 시선을 유지했습니다.');
        if (
            visualAll?.smile_mean != null &&
            (visualAll.smile_mean < 0.25 || visualAll.smile_mean > 0.75)
        )
            improvements.push('미소 강도를 너무 크거나 작지 않게 조절해보세요.');

        // 5) 질문별 상세 피드백
        const detailed_feedback: InterviewAnalysisResult['detailed_feedback'] = {};
        qa.forEach((q, i) => {
            const s = wordStats(q.answer || '');
            const hasNumber = s.digitCount > 0;
            const connectorsGood = s.connectors >= 1;
            const apq = audioPerQ?.find((x) => x.questionNumber === i + 1)?.audioFeatures;
            const tone = apq ? toneScore(apq) : undefined;
            const pace = apq ? paceScore(apq) : undefined;
            const parts: string[] = [];
            if (s.total < 30) parts.push('조금 더 구체적으로 서술해 주세요(사례/역할/성과).');
            if (!hasNumber) parts.push('수치나 지표를 1개 이상 포함해 주세요.');
            if (!connectorsGood) parts.push('따라서·왜냐하면 등 연결어로 흐름을 분명히 해 주세요.');
            if (typeof tone === 'number' && tone < 70)
                parts.push('톤의 흔들림을 줄이고 안정적으로 말해 보세요.');
            if (typeof pace === 'number' && pace < 70)
                parts.push('말 빠르기를 개인 기준에 맞춰 조정해 보세요.');
            if (parts.length === 0)
                parts.push('구조화(결론-근거-요약)를 유지하며 마무리까지 명확했습니다.');

            const content10 = Math.round(
                Math.min(
                    10,
                    3 +
                        scale01(s.total, 30, 120) * 4 +
                        (s.connectors >= 1 ? 2 : 0) +
                        (hasNumber ? 1 : 0),
                ),
            );
            const audio10q = [tone, pace]
                .filter((x): x is number => typeof x === 'number')
                .map((x) => x / 10);
            const score10 = Math.round(
                content10 * 0.7 +
                    (audio10q.length
                        ? audio10q.reduce((a, b) => a + b, 0) / audio10q.length
                        : 6.5) *
                        0.3,
            );

            detailed_feedback[`question_${i + 1}`] = {
                score: Math.max(1, Math.min(10, score10)),
                feedback: parts.join(' '),
            };
        });

        const overall_evaluation =
            `완성도 ${completeness10}/10, 구체성 ${specificity10}/10, 논리성 ${logic10}/10, 인상 ${impression10}/10로 평가됩니다. ` +
            `음성/표정 지표를 종합하면 기본기는 충분하며, 사례·지표 보강과 구조화로 설득력을 한층 높일 수 있습니다.`;

        const recommendations: string[] = [];
        if (specificity10 < 8) recommendations.push('모든 답변에 최소 1개의 수치/지표/사례를 포함');
        if (logic10 < 8) recommendations.push('결론-근거-사례-요약의 4단 구조 유지');
        if ((tScore ?? 0) < 75) recommendations.push('호흡-강세-멈춤으로 톤 안정화 연습');
        if ((pScore ?? 0) < 75) recommendations.push('개인 발화 비율 기준(≈60%)에 맞춰 속도 조절');
        recommendations.push('핵심 문장을 1~2개로 요약해 마무리');

        return {
            overall_score: Math.max(40, Math.min(98, overall)),
            detailed_scores: {
                completeness: Math.max(1, Math.min(10, completeness10)),
                specificity: Math.max(1, Math.min(10, specificity10)),
                logic: Math.max(1, Math.min(10, logic10)),
                impression: Math.max(1, Math.min(10, impression10)),
            },
            strengths,
            improvements,
            detailed_feedback,
            overall_evaluation,
            recommendations,
        };
    };

    // 입력 데이터가 준비되면 항상 프론트에서 리포트 재산출
    useEffect(() => {
        try {
            const computed = computeFrontendReport(
                qaList,
                audioOverall,
                visualOverall,
                audioPerQuestion,
            );
            setAnalysisResult(computed);
        } catch (e) {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        JSON.stringify(qaList),
        JSON.stringify(audioOverall),
        JSON.stringify(visualOverall),
        JSON.stringify(audioPerQuestion),
    ]);

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#52c41a';
        if (score >= 80) return '#1890ff';
        if (score >= 70) return '#faad14';
        return '#ff4d4f';
    };
    const getScoreLevel = (score: number) => {
        if (score >= 90) return '우수';
        if (score >= 80) return '양호';
        if (score >= 70) return '보통';
        return '개선 필요';
    };
    const getScoreIcon = (score: number) => {
        if (score >= 90) return <TrophyOutlined className='text-yellow-500' />;
        if (score >= 80) return <StarOutlined className='text-blue-500' />;
        if (score >= 70) return <CheckCircleOutlined className='text-orange-500' />;
        return <WarningOutlined className='text-red-500' />;
    };

    // ▼ ADDED: 간단 점수화(프론트 계산) — 서버에서 준 원시지표를 보기 좋게
    const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

    // === Audio Calibration (from localStorage.aiInterviewCalibration)
    const audioCalib = useMemo(() => {
        try {
            if (typeof window === 'undefined') return null;
            const raw = localStorage.getItem('aiInterviewCalibration');
            if (!raw) return null;
            const data = JSON.parse(raw);
            const a = data?.audio as AudioFeatures | undefined;
            if (!a) return null;
            // derive helpful baselines
            const baseTalk = 1 - (a.silence_ratio ?? 0);
            const baseCv =
                typeof a.f0_cv === 'number'
                    ? a.f0_cv
                    : a.f0_mean
                      ? (a.f0_std ?? 0) / a.f0_mean
                      : undefined;
            return {
                baseTalk: typeof baseTalk === 'number' && isFinite(baseTalk) ? baseTalk : 0.6,
                baseCv:
                    typeof baseCv === 'number' && isFinite(baseCv) && baseCv > 0 ? baseCv : 0.12,
                baseJitter: typeof a.jitter_like === 'number' ? a.jitter_like : undefined,
                baseShimmer: typeof a.shimmer_like === 'number' ? a.shimmer_like : undefined,
            };
        } catch {
            return null;
        }
    }, []);
    const toneScore = (f: AudioFeatures | undefined) => {
        if (!f) return undefined;

        // 1) CV 우선: 없으면 f0_std/f0_mean으로 유도
        const cv =
            typeof f.f0_cv === 'number' && isFinite(f.f0_cv) && f.f0_cv >= 0
                ? f.f0_cv
                : typeof f.f0_mean === 'number' && f.f0_mean > 0
                  ? (f.f0_std ?? 0) / f.f0_mean
                  : undefined;
        if (typeof cv === 'number' && isFinite(cv)) {
            if (audioCalib?.baseCv) {
                // 개인 기준 대비 비율 1.0 근처면 100점, 2.0이면 0점으로 스케일
                const ratio = cv / audioCalib.baseCv;
                const t = clamp01((ratio - 1) / 1.0); // 1.0→0, 2.0→1
                return Math.round((1 - t) * 100);
            }
            // 공통 기준(lo=0.05, hi=0.35)
            const lo = 0.05,
                hi = 0.35;
            const t = Math.min(1, Math.max(0, (cv - lo) / (hi - lo)));
            return Math.round((1 - t) * 100);
        }

        // 2) 세미톤 표준편차 보조: 1.0 → 100, 5.0 → 0
        if (typeof f.f0_std_semitone === 'number' && f.f0_std_semitone >= 0) {
            const st = f.f0_std_semitone;
            const lo = 1.0,
                hi = 5.0;
            const t = Math.min(1, Math.max(0, (st - lo) / (hi - lo)));
            return Math.round((1 - t) * 100);
        }

        // 3) 폴백: 절대 표준편차(Hz)
        const std = typeof f.f0_std === 'number' && isFinite(f.f0_std) ? f.f0_std : 0;
        const t = Math.min(1, std / 80);
        return Math.round((1 - t) * 100);
    };
    const vibratoScore = (f: AudioFeatures | undefined) => {
        if (!f) return undefined;
        const nj = Math.min(1, (f.jitter_like ?? 0) / 1.0);
        const ns = Math.min(1, (f.shimmer_like ?? 0) / 1.0);
        const rmsVar =
            typeof f.rms_cv_voiced === 'number' && isFinite(f.rms_cv_voiced)
                ? f.rms_cv_voiced
                : (f.rms_cv ?? 0);
        const nr = Math.min(1, rmsVar / 2.0);
        const bad = nj * 0.4 + ns * 0.4 + nr * 0.2;
        return Math.round((1 - bad) * 100);
    };
    const paceScore = (f: AudioFeatures | undefined) => {
        if (!f) return undefined;
        const talk = 1 - (f.silence_ratio ?? 0);
        const target = audioCalib?.baseTalk ?? 0.6; // 개인 기준 발화비율 사용
        const denom = target > 0 ? target : 0.6;
        const err = Math.abs(talk - target) / denom;
        return Math.round((1 - clamp01(err)) * 100);
    };

    // 말 빠르기 분류: 빠름/느림/적정
    const paceClass = (f: AudioFeatures | undefined) => {
        if (!f) return undefined;
        const talk = 1 - (f.silence_ratio ?? 0); // 발화 비율
        const target = audioCalib?.baseTalk ?? 0.6; // 개인 기준 발화 비율
        const tol = 0.1; // 허용 편차(±10%p)
        const delta = talk - target;
        if (delta > tol) return { label: '빠름', color: 'warning', talk } as const;
        if (delta < -tol) return { label: '느림', color: 'warning', talk } as const;
        return { label: '적정', color: 'success', talk } as const;
    };

    const audioScoreColor = (v?: number) => (typeof v === 'number' ? getScoreColor(v) : '#d9d9d9');

    // === ▼ ADDED: 영상 지표 간단 스코어링 (프론트 보기 좋게)
    const visualScoreColor = (v?: number | null) =>
        typeof v === 'number' ? getScoreColor(Math.round(v * 100)) : '#d9d9d9';
    const pct = (n?: number | null, total?: number | null) => {
        if (!n || !total || total <= 0) return '0%';
        return `${((n / total) * 100).toFixed(0)}%`;
    };

    // ===== 요약 카드(보이스/행동)용 산출 =====
    const voiceIndex = useMemo(() => {
        if (!audioOverall) return undefined;
        const arr = [
            toneScore(audioOverall as AudioFeatures),
            vibratoScore(audioOverall as AudioFeatures),
            paceScore(audioOverall as AudioFeatures),
        ].filter((x): x is number => typeof x === 'number' && isFinite(x));
        if (!arr.length) return undefined;
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    }, [audioOverall]);
    const voiceLevelText = useMemo(
        () => (typeof voiceIndex === 'number' ? getScoreLevel(voiceIndex) : '보통'),
        [voiceIndex],
    );
    const voiceSummaryMsg = useMemo(() => {
        if (!audioOverall) return '기본적인 전달력과 톤을 유지했습니다.';
        const t = toneScore(audioOverall as AudioFeatures) ?? 70;
        const v = vibratoScore(audioOverall as AudioFeatures) ?? 70;
        const p = paceClass(audioOverall as AudioFeatures)?.label;
        const parts: string[] = [];
        if (t >= 80) parts.push('안정적인 톤');
        if (v >= 80) parts.push('떨림이 적은 발화');
        if (p === '적정') parts.push('적정 속도');
        const good = parts.length ? parts.join(' · ') : undefined;
        const needs: string[] = [];
        if (t < 70) needs.push('톤 안정화');
        if (v < 70) needs.push('목소리 떨림 완화');
        if (p === '빠름') needs.push('속도 조절(느리게)');
        if (p === '느림') needs.push('속도 조절(빠르게)');
        if (good && !needs.length) return `${good}로 발화했습니다.`;
        if (good && needs.length) return `${good}였으며, ${needs.join(', ')}를 보완해보세요.`;
        if (!good && needs.length) return `${needs.join(', ')}가 필요합니다.`;
        return '일관적인 톤과 속도로 발화하도록 연습해보세요.';
    }, [audioOverall]);

    const assessBehavior = (v: any) => {
        if (!v || !v.count) {
            return {
                index: 70,
                level: '보통',
                msg: '기본적인 태도와 시선을 유지했습니다.',
            } as const;
        }
        const count = v.count || 0;
        const goodRatio = count ? (v.presence_dist?.good ?? 0) / count : 0;
        const warnRatio = count
            ? ((v.level_dist?.warning ?? 0) + (v.level_dist?.critical ?? 0)) / count
            : 0;
        const conf = typeof v.confidence_mean === 'number' ? v.confidence_mean : 0.65;
        const base = 0.6 * conf + 0.4 * goodRatio; // 0~1
        const penalty = Math.min(0.3, warnRatio * 0.6); // 경고 비중 패널티
        let score01 = Math.max(0, Math.min(1, base - penalty));
        if (goodRatio >= 0.9 && warnRatio <= 0.02) {
            score01 = Math.max(score01, conf >= 0.7 ? 0.9 : 0.8);
        }
        const index = Math.round(score01 * 100);
        const level = getScoreLevel(index);
        const main = `전체 면접 중 약 ${Math.round(goodRatio * 100)}%의 시간이 자신감 있는 모습으로 진행되었습니다.`;
        const msg =
            warnRatio > 0.02
                ? `${main} 간헐적인 긴장 신호가 감지되어 완급 조절과 표정 안정화에 신경 써보세요.`
                : `${main} 현재 태도를 유지해 주시면 좋겠습니다.`;
        return { index, level, msg } as const;
    };
    const behaviorOverall = useMemo(() => assessBehavior(visualOverall), [visualOverall]);
    const behaviorIndex = behaviorOverall?.index;
    const behaviorLevelText = behaviorOverall?.level ?? '보통';
    const behaviorSummaryMsg = behaviorOverall?.msg ?? '기본적인 태도와 시선을 유지했습니다.';

    if (loading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
                    <Text className='text-lg'>면접 결과를 불러오는 중...</Text>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
                <Card className='max-w-md mx-auto'>
                    <Alert message='오류 발생' description={error} type='error' showIcon />
                    <div className='text-center mt-4'>
                        <Link href='/ai-interview'>
                            <Button type='primary'>메인으로 돌아가기</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    // API 실패 시 화면
    if (analysisError) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
                <div className='container mx-auto px-4'>
                    {/* 헤더 */}
                    <div className='text-center mb-8'>
                        <Title level={1} className='!text-4xl !font-bold !text-gray-800 mb-4'>
                            <WarningOutlined className='mr-3 text-red-500' />
                            면접 분석 실패
                        </Title>
                        <Paragraph className='!text-lg !text-gray-600 max-w-2xl mx-auto'>
                            면접은 완료되었지만 분석 중 오류가 발생했습니다.
                        </Paragraph>
                    </div>

                    {/* 오류 메시지 */}
                    <Card className='!border-0 !shadow-lg mb-8'>
                        <Alert
                            message='분석 실패'
                            description={analysisError.message}
                            type='error'
                            showIcon
                            className='mb-4'
                        />
                        <div className='text-center'>
                            <Text type='secondary'>
                                면접 답변은 정상적으로 저장되었습니다. 나중에 다시 분석해보세요.
                            </Text>
                        </div>
                    </Card>

                    {/* 질문별 답변 표시 */}
                    <Card title='면접 답변 기록' className='!border-0 !shadow-lg mb-8'>
                        <List
                            dataSource={qaList}
                            renderItem={(qa, index) => (
                                <List.Item>
                                    <div className='w-full'>
                                        <div className='mb-3'>
                                            <Text strong className='text-lg'>
                                                Q{index + 1}. {qa.question}
                                            </Text>
                                        </div>
                                        <div className='bg-gray-50 p-4 rounded-lg'>
                                            <Text type='secondary' className='text-sm'>
                                                <strong>답변:</strong> {qa.answer}
                                            </Text>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>

                    {/* ▼ ADDED: 질문별 음성 분석 결과 (요약) */}
                    {audioPerQuestion && audioPerQuestion.length > 0 && (
                        <Card title='질문별 음성 분석 요약' className='!border-0 !shadow-lg mb-8'>
                            <List
                                dataSource={audioPerQuestion}
                                renderItem={(item) => {
                                    const tone = toneScore(item.audioFeatures);
                                    const vib = vibratoScore(item.audioFeatures);
                                    const pace = paceScore(item.audioFeatures);
                                    return (
                                        <List.Item>
                                            <div className='w-full'>
                                                <div className='flex justify-between items-start mb-3'>
                                                    <Text strong className='text-lg'>
                                                        Q{item.questionNumber}. {item.question}
                                                    </Text>
                                                    <Space>
                                                        {typeof tone === 'number' && (
                                                            <Tag color={audioScoreColor(tone)}>
                                                                <SoundOutlined /> 톤 {tone}
                                                            </Tag>
                                                        )}
                                                        {typeof vib === 'number' && (
                                                            <Tag color={audioScoreColor(vib)}>
                                                                <AudioOutlined /> 떨림 {vib}
                                                            </Tag>
                                                        )}
                                                        {typeof pace === 'number' && (
                                                            <Tag color={audioScoreColor(pace)}>
                                                                <ClockCircleOutlined /> 말빠르기{' '}
                                                                {pace}
                                                            </Tag>
                                                        )}
                                                    </Space>
                                                </div>

                                                {item.audioUrl && (
                                                    <audio
                                                        controls
                                                        src={item.audioUrl}
                                                        className='w-full mb-3'
                                                    />
                                                )}

                                                {item.audioFeatures && (
                                                    <Row gutter={[16, 16]}>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='f0_mean (Hz)'
                                                                    value={item.audioFeatures.f0_mean?.toFixed(
                                                                        1,
                                                                    )}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='f0_std (Hz)'
                                                                    value={item.audioFeatures.f0_std?.toFixed(
                                                                        2,
                                                                    )}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='f0_cv'
                                                                    value={item.audioFeatures.f0_cv?.toFixed(
                                                                        2,
                                                                    )}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='f0_std_semitone'
                                                                    value={item.audioFeatures.f0_std_semitone?.toFixed(
                                                                        2,
                                                                    )}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='rms_cv (voiced)'
                                                                    value={(
                                                                        item.audioFeatures
                                                                            .rms_cv_voiced ??
                                                                        item.audioFeatures.rms_cv ??
                                                                        0
                                                                    ).toFixed(3)}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        {typeof item.audioFeatures.voiced_ratio ===
                                                            'number' && (
                                                            <Col xs={24} sm={12} md={6}>
                                                                <Card size='small'>
                                                                    <Statistic
                                                                        title='유성 비율'
                                                                        value={`${((item.audioFeatures.voiced_ratio ?? 0) * 100).toFixed(1)}%`}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='침묵 비율'
                                                                    value={`${((item.audioFeatures.silence_ratio ?? 0) * 100).toFixed(1)}%`}
                                                                />
                                                            </Card>
                                                        </Col>
                                                    </Row>
                                                )}
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        </Card>
                    )}

                    {/* ▼ ADDED: 음성 분석 - 전체 요약 */}
                    {audioOverall && (
                        <Card title='종합 음성 분석' className='!border-0 !shadow-lg mb-8'>
                            <Row gutter={[16, 16]}>
                                {/* 간단 가시화: 톤/떨림/말빠르기 점수 (평균 원시치 기반) */}
                                <Col xs={24} md={8}>
                                    <Card size='small'>
                                        <div className='text-center mb-8'>
                                            <div className='text-base text-gray-600 mb-2'>
                                                톤 안정성
                                                <Tooltip title='기준: f0_cv 0.05→100, 0.35→0. 보조: f0_std_semitone 1.0→100, 5.0→0. 폴백: f0_std/80'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </div>
                                            <div
                                                className='text-4xl font-bold'
                                                style={{
                                                    color: audioScoreColor(
                                                        toneScore(audioOverall as AudioFeatures),
                                                    ),
                                                }}
                                            >
                                                {toneScore(audioOverall as AudioFeatures) ?? '-'}
                                            </div>
                                        </div>
                                        <Statistic
                                            title='평균 f0_mean (Hz)'
                                            value={(audioOverall.f0_mean ?? 0).toFixed(1)}
                                        />
                                        <Statistic
                                            title='평균 f0_std (Hz)'
                                            value={(audioOverall.f0_std ?? 0).toFixed(2)}
                                        />
                                        <Statistic
                                            title='평균 f0_cv (Hz)'
                                            value={(audioOverall.f0_cv ?? 0).toFixed(2)}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card size='small'>
                                        <div className='text-center mb-8'>
                                            <div className='text-base text-gray-600 mb-2'>
                                                목소리 떨림
                                                <Tooltip title='기준: 0~1 스케일의 jitter/shimmer/rms_cv(voiced) 가중합(0.4/0.4/0.2). 값이 작을수록 안정, 점수↑'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </div>
                                            <div
                                                className='text-4xl font-bold'
                                                style={{
                                                    color: audioScoreColor(
                                                        vibratoScore(audioOverall as AudioFeatures),
                                                    ),
                                                }}
                                            >
                                                {vibratoScore(audioOverall as AudioFeatures) ?? '-'}
                                            </div>
                                        </div>
                                        <Statistic
                                            title='평균 jitter_like'
                                            value={(audioOverall.jitter_like ?? 0).toFixed(3)}
                                        />
                                        <Statistic
                                            title='평균 shimmer_like'
                                            value={(audioOverall.shimmer_like ?? 0).toFixed(3)}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card size='small'>
                                        <div className='text-center mb-8'>
                                            <div className='text-base text-gray-600 mb-2'>
                                                말 빠르기(프록시)
                                                <Tooltip title='기준: talk=1-침묵비율, 목표 0.6. 오차가 적을수록 점수↑'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </div>
                                            <div
                                                className='text-4xl font-bold'
                                                style={{
                                                    color: audioScoreColor(
                                                        paceScore(audioOverall as AudioFeatures),
                                                    ),
                                                }}
                                            >
                                                {paceScore(audioOverall as AudioFeatures) ?? '-'}
                                            </div>
                                            {(() => {
                                                const pc = paceClass(audioOverall as AudioFeatures);
                                                if (!pc) return null;
                                                return (
                                                    <div className='mt-2'>
                                                        <Tag color={pc.color}>
                                                            <ClockCircleOutlined /> {pc.label} (
                                                            {Math.round(pc.talk * 100)}% 발화)
                                                        </Tag>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <Statistic
                                            title='평균 침묵 비율'
                                            value={`${((audioOverall.silence_ratio ?? 0) * 100).toFixed(1)}%`}
                                        />
                                        <Statistic
                                            title='평균 rms_cv (voiced)'
                                            value={(
                                                audioOverall.rms_cv_voiced ??
                                                audioOverall.rms_cv ??
                                                0
                                            ).toFixed(3)}
                                        />
                                        {typeof audioOverall.voiced_ratio === 'number' && (
                                            <Statistic
                                                title='평균 유성 비율'
                                                value={`${((audioOverall.voiced_ratio ?? 0) * 100).toFixed(1)}%`}
                                            />
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                            {/* Diagnostics (overall) */}
                            <Divider className='!my-4' />
                            <div className='text-sm text-gray-600 mb-2'>진단 지표(평균)</div>
                            <Row gutter={[16, 16]}>
                                {typeof (audioOverall as any).voiced_prob_mean === 'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='voiced_prob_mean'
                                                value={(
                                                    audioOverall as any
                                                ).voiced_prob_mean.toFixed(2)}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).voiced_prob_median === 'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='voiced_prob_median'
                                                value={(
                                                    audioOverall as any
                                                ).voiced_prob_median.toFixed(2)}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).voiced_prob_p90 === 'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='voiced_prob_p90'
                                                value={(
                                                    audioOverall as any
                                                ).voiced_prob_p90.toFixed(2)}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).silence_ratio_db50 === 'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='침묵 비율(db50) 평균'
                                                value={`${(((audioOverall as any).silence_ratio_db50 ?? 0) * 100).toFixed(1)}%`}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).voiced_flag_ratio === 'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='voiced_flag_ratio'
                                                value={`${(((audioOverall as any).voiced_flag_ratio ?? 0) * 100).toFixed(1)}%`}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).voiced_prob_ge_025_ratio ===
                                    'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='voiced_prob≥0.25 비율'
                                                value={`${(((audioOverall as any).voiced_prob_ge_025_ratio ?? 0) * 100).toFixed(1)}%`}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).voiced_prob_ge_035_ratio ===
                                    'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='voiced_prob≥0.35 비율'
                                                value={`${(((audioOverall as any).voiced_prob_ge_035_ratio ?? 0) * 100).toFixed(1)}%`}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).f0_valid_ratio === 'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='f0_valid_ratio'
                                                value={`${(((audioOverall as any).f0_valid_ratio ?? 0) * 100).toFixed(1)}%`}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).voiced_ratio_speech === 'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='유성 비율(speech) 평균'
                                                value={`${(((audioOverall as any).voiced_ratio_speech ?? 0) * 100).toFixed(1)}%`}
                                            />
                                        </Card>
                                    </Col>
                                )}
                                {typeof (audioOverall as any).speech_frames === 'number' && (
                                    <Col xs={24} sm={12} md={6}>
                                        <Card size='small'>
                                            <Statistic
                                                title='평균 speech_frames'
                                                value={`${(audioOverall as any).speech_frames?.toFixed(0)}`}
                                            />
                                        </Card>
                                    </Col>
                                )}
                            </Row>
                            {typeof audioOverall.voiced_ratio === 'number' &&
                                audioOverall.voiced_ratio < 0.2 && (
                                    <div className='mt-4'>
                                        <Alert
                                            type='warning'
                                            showIcon
                                            message='오디오 신뢰도 낮음'
                                            description='유성(발화) 비율이 낮아 지표 신뢰도가 떨어질 수 있습니다. 마이크/환경을 점검하고 충분히 말이 녹음되었는지 확인하세요.'
                                        />
                                    </div>
                                )}
                        </Card>
                    )}

                    {/* ▼ ADDED: 질문별 영상 요약 */}
                    {visualPerQuestion && (
                        <Card title='질문별 영상 분석 요약' className='!border-0 !shadow-lg mb-8'>
                            <List
                                dataSource={qaList}
                                renderItem={(qa, index) => {
                                    const qid = `q${index + 1}`;
                                    const v = visualPerQuestion[qid] as
                                        | VisualQuestionAgg
                                        | undefined;
                                    return (
                                        <List.Item>
                                            <div className='w-full'>
                                                <div className='flex justify-between items-start mb-3'>
                                                    <Text strong className='text-lg'>
                                                        Q{index + 1}. {qa.question}
                                                    </Text>
                                                    {v && (
                                                        <Space>
                                                            {/* 간단 표시: 자신감/미소 평균 */}
                                                            {typeof v.confidence_mean ===
                                                                'number' && (
                                                                <Tag
                                                                    color={visualScoreColor(
                                                                        v.confidence_mean,
                                                                    )}
                                                                >
                                                                    <ThunderboltOutlined /> 자신감{' '}
                                                                    {(
                                                                        v.confidence_mean * 100
                                                                    ).toFixed(0)}
                                                                </Tag>
                                                            )}
                                                            {typeof v.smile_mean === 'number' && (
                                                                <Tag
                                                                    color={visualScoreColor(
                                                                        v.smile_mean,
                                                                    )}
                                                                >
                                                                    <SmileOutlined /> 미소{' '}
                                                                    {(v.smile_mean * 100).toFixed(
                                                                        0,
                                                                    )}
                                                                </Tag>
                                                            )}
                                                        </Space>
                                                    )}
                                                </div>
                                                {v && (
                                                    <Row gutter={[16, 16]}>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='샘플 수'
                                                                    value={v.count}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title={
                                                                        <span>
                                                                            presence: good
                                                                            <Tooltip title='존재감 종합지표가 높은 구간 비중 (자신감·집중·긴장완화가 전반적으로 양호)'>
                                                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }
                                                                    value={pct(
                                                                        v.presence_dist.good,
                                                                        v.count,
                                                                    )}
                                                                />
                                                                <Statistic
                                                                    title={
                                                                        <span>
                                                                            presence: avg
                                                                            <Tooltip title='존재감 종합지표가 보통 수준인 구간 비중'>
                                                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }
                                                                    value={pct(
                                                                        v.presence_dist.average,
                                                                        v.count,
                                                                    )}
                                                                />
                                                                <Statistic
                                                                    title={
                                                                        <span>
                                                                            presence: needs
                                                                            <Tooltip title='존재감 종합지표가 낮은 구간 비중 (긴장↑·시선 이탈·자신감 부족 등)'>
                                                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }
                                                                    value={pct(
                                                                        v.presence_dist
                                                                            .needs_improvement,
                                                                        v.count,
                                                                    )}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title={
                                                                        <span>
                                                                            level: ok
                                                                            <Tooltip title='실시간 경고 없이 안정적으로 진행된 구간 비중'>
                                                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }
                                                                    value={pct(
                                                                        v.level_dist.ok,
                                                                        v.count,
                                                                    )}
                                                                />
                                                                <Statistic
                                                                    title={
                                                                        <span>
                                                                            level: warn
                                                                            <Tooltip title='실시간 경고가 발생한 구간 비중 (주로 긴장/주의 관련)'>
                                                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }
                                                                    value={pct(
                                                                        v.level_dist.warning,
                                                                        v.count,
                                                                    )}
                                                                />
                                                            </Card>
                                                        </Col>
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title={
                                                                        <span>
                                                                            conf_mean
                                                                            <Tooltip title='자신감 평균(0~100). 적당한 미소, 놀람/긴장 억제, 이마 개방감 등을 종합해 산출'>
                                                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }
                                                                    value={
                                                                        typeof v.confidence_mean ===
                                                                        'number'
                                                                            ? (
                                                                                  v.confidence_mean *
                                                                                  100
                                                                              ).toFixed(0)
                                                                            : '-'
                                                                    }
                                                                />
                                                                <Statistic
                                                                    title={
                                                                        <span>
                                                                            smile_mean
                                                                            <Tooltip title='미소 평균(0~100). 양쪽 입꼬리 상승 정도 기반'>
                                                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                                            </Tooltip>
                                                                        </span>
                                                                    }
                                                                    value={
                                                                        typeof v.smile_mean ===
                                                                        'number'
                                                                            ? (
                                                                                  v.smile_mean * 100
                                                                              ).toFixed(0)
                                                                            : '-'
                                                                    }
                                                                />
                                                            </Card>
                                                        </Col>
                                                    </Row>
                                                )}
                                            </div>
                                        </List.Item>
                                    );
                                }}
                            />
                        </Card>
                    )}

                    {/* ▼ ADDED: 종합 영상 분석 */}
                    {visualOverall && (
                        <Card title='종합 영상 분석' className='!border-0 !shadow-lg mb-8'>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <Card size='small'>
                                        <div className='text-center mb-8'>
                                            <div className='text-base text-gray-600 mb-2'>
                                                전체 자신감(평균)
                                            </div>
                                            <div
                                                className='text-4xl font-bold'
                                                style={{
                                                    color: visualScoreColor(
                                                        visualOverall.confidence_mean,
                                                    ),
                                                }}
                                            >
                                                {typeof visualOverall.confidence_mean === 'number'
                                                    ? (visualOverall.confidence_mean * 100).toFixed(
                                                          0,
                                                      )
                                                    : '-'}
                                            </div>
                                        </div>
                                        <Statistic title='샘플 수' value={visualOverall.count} />
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card size='small'>
                                        <div className='text-center mb-8'>
                                            <div className='text-base text-gray-600 mb-2'>
                                                전체 미소(평균)
                                            </div>
                                            <div
                                                className='text-4xl font-bold'
                                                style={{
                                                    color: visualScoreColor(
                                                        visualOverall.smile_mean,
                                                    ),
                                                }}
                                            >
                                                {typeof visualOverall.smile_mean === 'number'
                                                    ? (visualOverall.smile_mean * 100).toFixed(0)
                                                    : '-'}
                                            </div>
                                        </div>
                                        <Statistic
                                            title='presence good'
                                            value={pct(
                                                visualOverall.presence_dist.good,
                                                visualOverall.count,
                                            )}
                                        />
                                        <Statistic
                                            title='level ok'
                                            value={pct(
                                                visualOverall.level_dist.ok,
                                                visualOverall.count,
                                            )}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Card size='small'>
                                        <div className='text-center mb-8'>
                                            <div className='text-base text-gray-600 mb-2'>
                                                주의/경고 비중
                                            </div>
                                            <div className='text-4xl font-bold'>
                                                {pct(
                                                    visualOverall.level_dist.warning +
                                                        visualOverall.level_dist.critical,
                                                    visualOverall.count,
                                                )}
                                            </div>
                                        </div>
                                        <Statistic
                                            title='경고(warn)'
                                            value={visualOverall.level_dist.warning}
                                        />
                                        <Statistic
                                            title='치명(critical)'
                                            value={visualOverall.level_dist.critical}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </Card>
                    )}

                    {/* 액션 버튼 */}
                    <div className='text-center'>
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

    if (!analysisResult) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
                    <Text className='text-lg'>면접 결과를 불러오는 중...</Text>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
            <div className='container mx-auto px-4'>
                {/* 헤더 */}
                <div id='summary' className='text-center mb-8'>
                    <Title level={1} className='!text-4xl !font-bold !text-gray-800 mb-4'>
                        <TrophyOutlined className='mr-3 text-yellow-500' />
                        AI 모의면접 결과 리포트
                    </Title>
                    <Paragraph className='!text-lg !text-gray-600 max-w-2xl mx-auto'>
                        굿잡이 제공하는 AI 모의면접 결과 리포트를 확인해보세요.
                    </Paragraph>
                    <div className='mt-4 print:hidden'>
                        <Space>
                            <Button icon={<DownloadOutlined />} onClick={handlePrint}>
                                PDF로 저장/인쇄
                            </Button>
                            <Button icon={<LinkOutlined />} onClick={handleShare}>
                                링크 복사
                            </Button>
                        </Space>
                    </div>
                </div>

                {/* 전체 점수 카드 */}
                <Card className='!border-0 !shadow-lg mb-8'>
                    <div className='text-center'>
                        <div className='flex items-center justify-center mb-4'>
                            {getScoreIcon(analysisResult.overall_score)}
                            <div
                                className='text-6xl font-bold ml-4'
                                style={{ color: getScoreColor(analysisResult.overall_score) }}
                            >
                                {analysisResult.overall_score}점
                            </div>
                        </div>
                        <Title level={2} className='!text-2xl !font-bold !text-gray-800 mb-2'>
                            {getScoreLevel(analysisResult.overall_score)}
                        </Title>
                        <Progress
                            percent={analysisResult.overall_score}
                            strokeColor={getScoreColor(analysisResult.overall_score)}
                            className='max-w-md mx-auto'
                        />
                    </div>
                </Card>

                {/* 빠른 이동 앵커 */}
                <div className='print:hidden sticky top-0 z-10 mb-6'>
                    <div className='bg-white/80 backdrop-blur rounded-lg shadow p-2 flex flex-wrap gap-2 justify-center text-sm'>
                        <a href='#scores' className='px-3 py-1 hover:underline'>
                            세부 점수
                        </a>
                        <a href='#evaluation' className='px-3 py-1 hover:underline'>
                            종합 평가
                        </a>
                        <a href='#badges' className='px-3 py-1 hover:underline'>
                            성과 배지
                        </a>
                        <a href='#audio' className='px-3 py-1 hover:underline'>
                            음성 분석
                        </a>
                        <a href='#visual' className='px-3 py-1 hover:underline'>
                            영상 분석
                        </a>
                        <a href='#questions' className='px-3 py-1 hover:underline'>
                            질문별 피드백
                        </a>
                        <a href='#recommend' className='px-3 py-1 hover:underline'>
                            추천사항
                        </a>
                    </div>
                </div>

                {/* 상세 점수 */}
                <Row id='scores' gutter={[24, 24]} className='mb-8'>
                    <Col xs={24} sm={12} md={6}>
                        <Card className='!border-0 !shadow-lg text-center'>
                            <Statistic
                                title='완성도'
                                value={analysisResult.detailed_scores.completeness}
                                suffix='/ 10'
                                prefix={<CheckCircleOutlined className='text-green-500' />}
                                valueStyle={{
                                    color: getScoreColor(
                                        analysisResult.detailed_scores.completeness * 10,
                                    ),
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className='!border-0 !shadow-lg text-center'>
                            <Statistic
                                title='구체성'
                                value={analysisResult.detailed_scores.specificity}
                                suffix='/ 10'
                                prefix={<MessageOutlined className='text-blue-500' />}
                                valueStyle={{
                                    color: getScoreColor(
                                        analysisResult.detailed_scores.specificity * 10,
                                    ),
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className='!border-0 !shadow-lg text-center'>
                            <Statistic
                                title='논리성'
                                value={analysisResult.detailed_scores.logic}
                                suffix='/ 10'
                                prefix={<BulbOutlined className='text-purple-500' />}
                                valueStyle={{
                                    color: getScoreColor(analysisResult.detailed_scores.logic * 10),
                                }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className='!border-0 !shadow-lg text-center'>
                            <Statistic
                                title='인상'
                                value={analysisResult.detailed_scores.impression}
                                suffix='/ 10'
                                prefix={<EyeOutlined className='text-orange-500' />}
                                valueStyle={{
                                    color: getScoreColor(
                                        analysisResult.detailed_scores.impression * 10,
                                    ),
                                }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* 종합 평가 */}
                <Card id='evaluation' title='종합 평가' className='!border-0 !shadow-lg mb-8'>
                    <Paragraph className='!text-lg !leading-relaxed'>
                        {analysisResult.overall_evaluation}
                    </Paragraph>
                </Card>

                {/* 요약(보이스/행동) */}
                {(audioOverall || visualOverall) && (
                    <Row gutter={[24, 24]} className='mb-8'>
                        {audioOverall && (
                            <Col xs={24} md={12}>
                                <Card className='!border-0 !shadow-lg' bodyStyle={{ padding: 24 }}>
                                    <div className='flex items-start gap-4'>
                                        <div className='text-4xl text-blue-500'>
                                            <SoundOutlined />
                                        </div>
                                        <div className='flex-1'>
                                            <div className='text-xl text-gray-800 mb-1'>
                                                보이스{' '}
                                                <span className='text-blue-500 font-semibold'>
                                                    {voiceLevelText}
                                                </span>
                                            </div>
                                            <div className='text-gray-600'>{voiceSummaryMsg}</div>
                                            <div className='mt-3'>
                                                <Button
                                                    size='small'
                                                    onClick={() => setShowAudioDetails((v) => !v)}
                                                >
                                                    {showAudioDetails
                                                        ? '지표 닫기'
                                                        : '지표 확인하기'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        )}
                        {visualOverall && (
                            <Col xs={24} md={12}>
                                <Card className='!border-0 !shadow-lg' bodyStyle={{ padding: 24 }}>
                                    <div className='flex items-start gap-4'>
                                        <div className='text-4xl text-blue-500'>
                                            <SmileOutlined />
                                        </div>
                                        <div className='flex-1'>
                                            <div className='text-xl text-gray-800 mb-1'>
                                                행동{' '}
                                                <span className='text-blue-500 font-semibold'>
                                                    {behaviorLevelText}
                                                </span>
                                            </div>
                                            <div className='text-gray-600'>
                                                {behaviorSummaryMsg}
                                            </div>
                                            <div className='mt-3'>
                                                <Button
                                                    size='small'
                                                    onClick={() => setShowVisualDetails((v) => !v)}
                                                >
                                                    {showVisualDetails
                                                        ? '지표 닫기'
                                                        : '지표 확인하기'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        )}
                    </Row>
                )}

                {/* 성과 배지 */}
                {(audioOverall || visualOverall) && (
                    <Card id='badges' title='성과 배지' className='!border-0 !shadow-lg mb-8'>
                        <Space size={[12, 12]} wrap>
                            {/* 자신감 우수 */}
                            {typeof visualOverall?.confidence_mean === 'number' &&
                                visualOverall.confidence_mean >= 0.7 && (
                                    <Tag color='blue' className='px-3 py-2 text-base'>
                                        <SmileOutlined className='mr-1' /> 자신감 우수
                                    </Tag>
                                )}
                            {/* 미소 적정 */}
                            {typeof visualOverall?.smile_mean === 'number' &&
                                visualOverall.smile_mean >= 0.3 &&
                                visualOverall.smile_mean <= 0.7 && (
                                    <Tag color='green' className='px-3 py-2 text-base'>
                                        <SmileOutlined className='mr-1' /> 미소 적정
                                    </Tag>
                                )}
                            {/* 톤 안정적 */}
                            {typeof (audioOverall as any)?.f0_mean !== 'undefined' &&
                                (() => {
                                    const t = toneScore(audioOverall as any);
                                    if (typeof t === 'number' && t >= 80)
                                        return (
                                            <Tag color='processing' className='px-3 py-2 text-base'>
                                                <SoundOutlined className='mr-1' /> 톤 안정적
                                            </Tag>
                                        );
                                    return null;
                                })()}
                            {/* 발화 비율 적정 */}
                            {(() => {
                                const pc = paceClass(audioOverall as any);
                                if (pc?.label === '적정')
                                    return (
                                        <Tag color='success' className='px-3 py-2 text-base'>
                                            <ClockCircleOutlined className='mr-1' /> 발화 비율 적정
                                        </Tag>
                                    );
                                return null;
                            })()}
                            {/* 긴장 신호 주의 */}
                            {visualOverall && visualOverall.level_dist?.warning > 0 && (
                                <Tag color='warning' className='px-3 py-2 text-base'>
                                    <WarningOutlined className='mr-1' /> 긴장 신호 주의
                                </Tag>
                            )}
                        </Space>
                    </Card>
                )}

                {/* 강점과 개선사항 */}
                <Row gutter={[24, 24]} className='mb-8'>
                    <Col xs={24} lg={12}>
                        <Card title='강점' className='!border-0 !shadow-lg'>
                            <List
                                dataSource={analysisResult.strengths}
                                renderItem={(item) => (
                                    <List.Item>
                                        <CheckCircleOutlined className='text-green-500 mr-2' />
                                        <Text>{item}</Text>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title='개선사항' className='!border-0 !shadow-lg'>
                            <List
                                dataSource={analysisResult.improvements}
                                renderItem={(item) => (
                                    <List.Item>
                                        <RiseOutlined className='text-orange-500 mr-2' />
                                        <Text>{item}</Text>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* 질문별 상세 피드백 */}
                <Card
                    id='questions'
                    title='질문별 상세 피드백'
                    className='!border-0 !shadow-lg mb-8'
                >
                    <List
                        dataSource={qaList}
                        renderItem={(qa, index) => {
                            const questionKey = `question_${index + 1}`;
                            const feedback = analysisResult.detailed_feedback[questionKey];
                            return (
                                <List.Item>
                                    <div className='w-full'>
                                        <div className='flex justify-between items-start mb-3'>
                                            <Text strong className='text-lg'>
                                                Q{index + 1}. {qa.question}
                                            </Text>
                                            {feedback && (
                                                <Tag
                                                    color={getScoreColor(feedback.score * 10)}
                                                    className='text-sm'
                                                >
                                                    {feedback.score}/10점
                                                </Tag>
                                            )}
                                        </div>
                                        <div className='bg-gray-50 p-4 rounded-lg mb-3'>
                                            <Text type='secondary' className='text-sm'>
                                                <strong>답변:</strong> {qa.answer}
                                            </Text>
                                        </div>
                                        {feedback && (
                                            <div className='bg-blue-50 p-4 rounded-lg'>
                                                <Text className='text-sm'>
                                                    <strong>AI 피드백:</strong> {feedback.feedback}
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                </Card>

                {/* ▼ ADDED: 종합 영상 지표 (접힘) */}
                {visualOverall && showVisualDetails && (
                    <Card
                        id='visual'
                        title={
                            <span>
                                종합 영상 지표
                                <Tooltip
                                    title='점수= 40%자신감 + 25%존재감 + 15%미소균형 + 10%시선맞춤 + 10%시선안정 − 페널티(0.6×경고 + 1.0×치명, 최대 0.4)'
                                >
                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                </Tooltip>
                            </span>
                        }
                        className='!border-0 !shadow-lg mb-8'
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <Card size='small'>
                                    <div className='text-center mb-8'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            전체 자신감(평균)
                                        </div>
                                        <div
                                            className='text-4xl font-bold'
                                            style={{
                                                color: visualScoreColor(
                                                    visualOverall.confidence_mean,
                                                ),
                                            }}
                                        >
                                            {typeof visualOverall.confidence_mean === 'number'
                                                ? (visualOverall.confidence_mean * 100).toFixed(0)
                                                : '-'}
                                        </div>
                                    </div>
                                    <Statistic title='샘플 수' value={visualOverall.count} />
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card size='small'>
                                    <div className='text-center mb-8'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            전체 미소(평균)
                                        </div>
                                        <div
                                            className='text-4xl font-bold'
                                            style={{
                                                color: visualScoreColor(visualOverall.smile_mean),
                                            }}
                                        >
                                            {typeof visualOverall.smile_mean === 'number'
                                                ? (visualOverall.smile_mean * 100).toFixed(0)
                                                : '-'}
                                        </div>
                                    </div>
                                    <Statistic
                                        title={
                                            <span>
                                                시선 맞춤(평균)
                                                <Tooltip title='카메라/면접관을 향한 시선 비율(0~100)'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </span>
                                        }
                                        value={
                                            typeof visualOverall.eye_contact_mean === 'number'
                                                ? (visualOverall.eye_contact_mean * 100).toFixed(0)
                                                : '-'
                                        }
                                    />
                                    <Statistic
                                        title={
                                            <span>
                                                presence good
                                                <Tooltip title='존재감 종합지표가 높은 구간 비중 (자신감·집중·긴장완화 양호)'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </span>
                                        }
                                        value={pct(
                                            visualOverall.presence_dist.good,
                                            visualOverall.count,
                                        )}
                                    />
                                    <Statistic
                                        title={
                                            <span>
                                                level ok
                                                <Tooltip title='실시간 경고 없이 안정적으로 진행된 구간 비중'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </span>
                                        }
                                        value={pct(
                                            visualOverall.level_dist.ok,
                                            visualOverall.count,
                                        )}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card size='small'>
                                    <div className='text-center mb-8'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            주의/경고 비중
                                        </div>
                                        <div className='text-4xl font-bold'>
                                            {pct(
                                                visualOverall.level_dist.warning +
                                                    visualOverall.level_dist.critical,
                                                visualOverall.count,
                                            )}
                                        </div>
                                    </div>
                                    <Statistic
                                        title={
                                            <span>
                                                시선 안정성
                                                <Tooltip title='얼굴 중심(코) 좌표 변동 표준편차 기반 0~100 (높을수록 안정)'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </span>
                                        }
                                        value={
                                            typeof visualOverall.gaze_stability === 'number'
                                                ? (visualOverall.gaze_stability * 100).toFixed(0)
                                                : '-'
                                        }
                                    />
                                    <Statistic
                                        title={
                                            <span>
                                                깜빡임(평균)
                                                <Tooltip title='눈 깜빡임 확률(0~100). 과도한 깜빡임은 긴장/피로 신호일 수 있음'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </span>
                                        }
                                        value={
                                            typeof visualOverall.blink_mean === 'number'
                                                ? (visualOverall.blink_mean * 100).toFixed(0)
                                                : '-'
                                        }
                                    />
                                    <Statistic
                                        title={
                                            <span>
                                                경고(warn)
                                                <Tooltip title='실시간 경고(주의)가 발생한 샘플 수'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </span>
                                        }
                                        value={visualOverall.level_dist.warning}
                                    />
                                    <Statistic
                                        title={
                                            <span>
                                                치명(critical)
                                                <Tooltip title='심각 경고가 발생한 샘플 수'>
                                                    <InfoCircleOutlined className='ml-2 text-gray-400' />
                                                </Tooltip>
                                            </span>
                                        }
                                        value={visualOverall.level_dist.critical}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                )}

                {/* ▼ ADDED: 종합 음성 지표 (접힘) */}
                {audioOverall && showAudioDetails && (
                    <Card title='종합 음성 지표' className='!border-0 !shadow-lg mb-8'>
                        <Row gutter={[16, 16]}>
                            {/* 간단 가시화: 톤/떨림/말빠르기 점수 (평균 원시치 기반) */}
                            <Col xs={24} md={8}>
                                <Card size='small'>
                                    <div className='text-center mb-8'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            톤 안정성
                                            <Tooltip title='기준: f0_cv 0.05→100, 0.35→0. 보조: f0_std_semitone 1.0→100, 5.0→0. 폴백: f0_std/80'>
                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                            </Tooltip>
                                        </div>
                                        <div
                                            className='text-4xl font-bold'
                                            style={{
                                                color: audioScoreColor(
                                                    toneScore(audioOverall as AudioFeatures),
                                                ),
                                            }}
                                        >
                                            {toneScore(audioOverall as AudioFeatures) ?? '-'}
                                        </div>
                                    </div>
                                    <Statistic
                                        title='평균 f0_mean (Hz)'
                                        value={(audioOverall.f0_mean ?? 0).toFixed(1)}
                                    />
                                    <Statistic
                                        title='평균 f0_std (Hz)'
                                        value={(audioOverall.f0_std ?? 0).toFixed(2)}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card size='small'>
                                    <div className='text-center mb-8'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            목소리 떨림
                                            <Tooltip title='기준: 0~1 스케일의 jitter/shimmer/rms_cv(voiced) 가중합(0.4/0.4/0.2). 값이 작을수록 안정, 점수↑'>
                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                            </Tooltip>
                                        </div>
                                        <div
                                            className='text-4xl font-bold'
                                            style={{
                                                color: audioScoreColor(
                                                    vibratoScore(audioOverall as AudioFeatures),
                                                ),
                                            }}
                                        >
                                            {vibratoScore(audioOverall as AudioFeatures) ?? '-'}
                                        </div>
                                    </div>
                                    <Statistic
                                        title='평균 jitter_like'
                                        value={(audioOverall.jitter_like ?? 0).toFixed(3)}
                                    />
                                    <Statistic
                                        title='평균 shimmer_like'
                                        value={(audioOverall.shimmer_like ?? 0).toFixed(3)}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={8}>
                                <Card size='small'>
                                    <div className='text-center mb-8'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            말 빠르기(프록시)
                                            <Tooltip title='기준: talk=1-침묵비율, 목표 0.6. 오차가 적을수록 점수↑'>
                                                <InfoCircleOutlined className='ml-2 text-gray-400' />
                                            </Tooltip>
                                        </div>
                                        <div
                                            className='text-4xl font-bold'
                                            style={{
                                                color: audioScoreColor(
                                                    paceScore(audioOverall as AudioFeatures),
                                                ),
                                            }}
                                        >
                                            {paceScore(audioOverall as AudioFeatures) ?? '-'}
                                        </div>
                                    </div>
                                    <Statistic
                                        title='평균 침묵 비율'
                                        value={`${((audioOverall.silence_ratio ?? 0) * 100).toFixed(1)}%`}
                                    />
                                    <Statistic
                                        title='평균 rms_cv (voiced)'
                                        value={(
                                            audioOverall.rms_cv_voiced ??
                                            audioOverall.rms_cv ??
                                            0
                                        ).toFixed(3)}
                                    />
                                    {typeof audioOverall.voiced_ratio === 'number' && (
                                        <Statistic
                                            title='평균 유성 비율'
                                            value={`${((audioOverall.voiced_ratio ?? 0) * 100).toFixed(1)}%`}
                                        />
                                    )}
                                </Card>
                            </Col>
                        </Row>
                        {typeof audioOverall.voiced_ratio === 'number' &&
                            audioOverall.voiced_ratio < 0.2 && (
                                <div className='mt-4'>
                                    <Alert
                                        type='warning'
                                        showIcon
                                        message='오디오 신뢰도 낮음'
                                        description='유성(발화) 비율이 낮아 지표 신뢰도가 떨어질 수 있습니다. 마이크/환경을 점검하고 충분히 말이 녹음되었는지 확인하세요.'
                                    />
                                </div>
                            )}
                    </Card>
                )}

                {/* ▼ ADDED: 음성 분석 - 질문별 상세 */}
                {audioPerQuestion && audioPerQuestion.length > 0 && (
                    <Card
                        id='audio'
                        title='질문별 음성 분석 상세'
                        className='!border-0 !shadow-lg mb-8'
                    >
                        <List
                            dataSource={audioPerQuestion}
                            renderItem={(item) => {
                                const tone = toneScore(item.audioFeatures as AudioFeatures);
                                const vib = vibratoScore(item.audioFeatures as AudioFeatures);
                                const pace = paceScore(item.audioFeatures as AudioFeatures);
                                const qno = item.questionNumber;
                                const vAgg: any = visualPerQuestion
                                    ? (visualPerQuestion as any)[`q${qno}`]
                                    : undefined;
                                const voiceLevel = (() => {
                                    const arr = [tone, vib, pace].filter(
                                        (x): x is number => typeof x === 'number' && isFinite(x),
                                    );
                                    if (!arr.length) return '보통';
                                    return getScoreLevel(
                                        Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
                                    );
                                })();
                                const voiceMsg = (() => {
                                    const parts: string[] = [];
                                    if (typeof tone === 'number' && tone >= 80)
                                        parts.push('안정적인 톤');
                                    if (typeof vib === 'number' && vib >= 80)
                                        parts.push('떨림 적음');
                                    const pc = paceClass(item.audioFeatures as AudioFeatures);
                                    if (pc?.label === '적정') parts.push('속도 적정');
                                    if (!parts.length)
                                        return '응시 중 목소리의 강/약이 일정하지 않았습니다. 일관적인 톤으로 발화할 수 있도록 연습해보세요.';
                                    return `${parts.join(' · ')}로 발화했습니다.`;
                                })();
                                const assessBehaviorQ = (v: any) => {
                                    if (!v || !v.count)
                                        return {
                                            level: '보통',
                                            msg: '기본적인 태도와 시선을 유지했습니다.',
                                        } as const;
                                    const count = v.count || 0;
                                    const good = count ? (v.presence_dist?.good ?? 0) / count : 0;
                                    const warnRatio = count
                                        ? ((v.level_dist?.warning ?? 0) +
                                              (v.level_dist?.critical ?? 0)) /
                                          count
                                        : 0;
                                    const conf =
                                        typeof v.confidence_mean === 'number'
                                            ? v.confidence_mean
                                            : 0.65;
                                    const base = 0.6 * conf + 0.4 * good;
                                    const penalty = Math.min(0.3, warnRatio * 0.6);
                                    let s01 = Math.max(0, Math.min(1, base - penalty));
                                    if (good >= 0.9 && warnRatio <= 0.02)
                                        s01 = Math.max(s01, conf >= 0.7 ? 0.9 : 0.8);
                                    const level = getScoreLevel(Math.round(s01 * 100));
                                    const main = `이 구간의 약 ${Math.round(good * 100)}%는 자신감 있는 모습으로 진행되었습니다.`;
                                    const msg =
                                        warnRatio > 0.02
                                            ? `${main} 간헐적인 긴장 신호가 관측되어 완급 조절과 표정 안정화에 신경 써보세요.`
                                            : `${main} 현재 태도를 유지해 보세요.`;
                                    return { level, msg } as const;
                                };
                                const { level: behaviorLevel, msg: behaviorMsg } =
                                    assessBehaviorQ(vAgg);
                                return (
                                    <List.Item>
                                        <div className='w-full'>
                                            <div className='flex justify-between items-start mb-3'>
                                                <Text strong className='text-lg'>
                                                    Q{item.questionNumber}. {item.question}
                                                </Text>
                                                <Space>
                                                    {typeof tone === 'number' && (
                                                        <Tag color={audioScoreColor(tone)}>
                                                            <SoundOutlined /> 톤 {tone}
                                                        </Tag>
                                                    )}
                                                    {typeof vib === 'number' && (
                                                        <Tag color={audioScoreColor(vib)}>
                                                            <AudioOutlined /> 떨림 {vib}
                                                        </Tag>
                                                    )}
                                                    {typeof pace === 'number' && (
                                                        <Tag color={audioScoreColor(pace)}>
                                                            <ClockCircleOutlined /> 말빠르기 {pace}
                                                        </Tag>
                                                    )}
                                                    {(() => {
                                                        const pc = paceClass(
                                                            item.audioFeatures as AudioFeatures,
                                                        );
                                                        if (!pc) return null;
                                                        return (
                                                            <Tag color={pc.color}>
                                                                <ClockCircleOutlined /> {pc.label}
                                                            </Tag>
                                                        );
                                                    })()}
                                                    {typeof item.audioFeatures?.voiced_ratio ===
                                                        'number' &&
                                                        item.audioFeatures.voiced_ratio < 0.2 && (
                                                            <Tag color='warning'>
                                                                <WarningOutlined /> 유성 비율 낮음
                                                            </Tag>
                                                        )}
                                                </Space>
                                            </div>

                                            {item.audioUrl &&
                                                (/^data:|^https?:/.test(item.audioUrl) ? (
                                                    <audio
                                                        controls
                                                        src={item.audioUrl}
                                                        className='w-full mb-3'
                                                    />
                                                ) : null)}

                                            {/* 요약 카드: 보이스/행동 */}
                                            <Row gutter={[16, 16]} className='mb-3'>
                                                <Col xs={24} md={12}>
                                                    <div className='bg-blue-50 rounded-xl p-4 h-full'>
                                                        <div className='text-xs text-blue-600 font-semibold mb-1'>
                                                            보이스{' '}
                                                            <Tooltip title='톤 안정성/떨림/속도 기반 요약'>
                                                                <InfoCircleOutlined />
                                                            </Tooltip>
                                                        </div>
                                                        <div className='text-lg font-semibold text-gray-800 mb-1'>
                                                            {voiceLevel === '우수'
                                                                ? '아주 좋아요 👏'
                                                                : voiceLevel === '양호'
                                                                  ? '좋아요 🙂'
                                                                  : voiceLevel === '보통'
                                                                    ? '조금 더 안정적으로 😊'
                                                                    : '긴장 낮추고 차분하게 💪'}
                                                        </div>
                                                        <div className='text-gray-600 text-sm'>
                                                            {voiceMsg}
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <div className='bg-blue-50 rounded-xl p-4 h-full'>
                                                        <div className='text-xs text-blue-600 font-semibold mb-1'>
                                                            행동{' '}
                                                            <Tooltip title='자신감/존재감/경고 비중 기반 요약'>
                                                                <InfoCircleOutlined />
                                                            </Tooltip>
                                                        </div>
                                                        <div className='text-lg font-semibold text-gray-800 mb-1'>
                                                            {behaviorLevel === '우수'
                                                                ? '아주 집중되어 있어요 🔥'
                                                                : behaviorLevel === '양호'
                                                                  ? '집중 잘 유지 👍'
                                                                  : behaviorLevel === '보통'
                                                                    ? '조금 더 집중해 주세요 👀'
                                                                    : '긴장 신호 주의 ⚠️'}
                                                        </div>
                                                        <div className='text-gray-600 text-sm'>
                                                            {behaviorMsg}
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>

                                            <div className='mb-3'>
                                                <Button
                                                    size='small'
                                                    onClick={() =>
                                                        setShowDetailByQuestion((m) => ({
                                                            ...m,
                                                            [item.questionNumber]:
                                                                !m[item.questionNumber],
                                                        }))
                                                    }
                                                >
                                                    {showDetailByQuestion[item.questionNumber]
                                                        ? '지표 닫기'
                                                        : '지표 확인하기'}
                                                </Button>
                                            </div>

                                            {item.audioFeatures && (
                                                <Row
                                                    gutter={[16, 16]}
                                                    style={{
                                                        display: showDetailByQuestion[
                                                            item.questionNumber
                                                        ]
                                                            ? undefined
                                                            : 'none',
                                                    }}
                                                >
                                                    <Col xs={24} sm={12} md={6}>
                                                        <Card size='small'>
                                                            <Statistic
                                                                title='f0_mean (Hz)'
                                                                value={item.audioFeatures.f0_mean.toFixed(
                                                                    1,
                                                                )}
                                                            />
                                                        </Card>
                                                    </Col>
                                                    <Col xs={24} sm={12} md={6}>
                                                        <Card size='small'>
                                                            <Statistic
                                                                title='f0_std (Hz)'
                                                                value={item.audioFeatures.f0_std.toFixed(
                                                                    2,
                                                                )}
                                                            />
                                                        </Card>
                                                    </Col>
                                                    <Col xs={24} sm={12} md={6}>
                                                        <Card size='small'>
                                                            <Statistic
                                                                title='rms_cv (voiced)'
                                                                value={(
                                                                    item.audioFeatures
                                                                        .rms_cv_voiced ??
                                                                    item.audioFeatures.rms_cv ??
                                                                    0
                                                                ).toFixed(3)}
                                                            />
                                                        </Card>
                                                    </Col>
                                                    <Col xs={24} sm={12} md={6}>
                                                        <Card size='small'>
                                                            <Statistic
                                                                title='침묵 비율'
                                                                value={`${(item.audioFeatures.silence_ratio * 100).toFixed(1)}%`}
                                                            />
                                                        </Card>
                                                    </Col>
                                                    {typeof item.audioFeatures
                                                        .silence_ratio_db50 === 'number' && (
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='침묵 비율(db50)'
                                                                    value={`${((item.audioFeatures.silence_ratio_db50 ?? 0) * 100).toFixed(1)}%`}
                                                                />
                                                            </Card>
                                                        </Col>
                                                    )}
                                                    {typeof item.audioFeatures
                                                        .voiced_ratio_speech === 'number' && (
                                                        <Col xs={24} sm={12} md={6}>
                                                            <Card size='small'>
                                                                <Statistic
                                                                    title='유성 비율(speech)'
                                                                    value={`${((item.audioFeatures.voiced_ratio_speech ?? 0) * 100).toFixed(1)}%`}
                                                                />
                                                            </Card>
                                                        </Col>
                                                    )}
                                                </Row>
                                            )}
                                            {item.audioFeatures && (
                                                <>
                                                    <Divider className='!my-3' />
                                                    <div className='text-sm text-gray-600 mb-2'>
                                                        진단 지표
                                                    </div>
                                                    <Row
                                                        gutter={[16, 16]}
                                                        style={{
                                                            display: showDetailByQuestion[
                                                                item.questionNumber
                                                            ]
                                                                ? undefined
                                                                : 'none',
                                                        }}
                                                    >
                                                        {typeof item.audioFeatures
                                                            .voiced_prob_mean === 'number' && (
                                                            <Col xs={24} sm={12} md={6}>
                                                                <Card size='small'>
                                                                    <Statistic
                                                                        title='voiced_prob_mean'
                                                                        value={item.audioFeatures.voiced_prob_mean.toFixed(
                                                                            2,
                                                                        )}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                        {typeof item.audioFeatures
                                                            .voiced_prob_median === 'number' && (
                                                            <Col xs={24} sm={12} md={6}>
                                                                <Card size='small'>
                                                                    <Statistic
                                                                        title='voiced_prob_median'
                                                                        value={item.audioFeatures.voiced_prob_median.toFixed(
                                                                            2,
                                                                        )}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                        {typeof item.audioFeatures
                                                            .voiced_prob_p90 === 'number' && (
                                                            <Col xs={24} sm={12} md={6}>
                                                                <Card size='small'>
                                                                    <Statistic
                                                                        title='voiced_prob_p90'
                                                                        value={item.audioFeatures.voiced_prob_p90.toFixed(
                                                                            2,
                                                                        )}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                        {typeof item.audioFeatures
                                                            .voiced_flag_ratio === 'number' && (
                                                            <Col xs={24} sm={12} md={6}>
                                                                <Card size='small'>
                                                                    <Statistic
                                                                        title='voiced_flag_ratio'
                                                                        value={`${(item.audioFeatures.voiced_flag_ratio * 100).toFixed(1)}%`}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                        {typeof item.audioFeatures
                                                            .voiced_prob_ge_025_ratio ===
                                                            'number' && (
                                                            <Col xs={24} sm={12} md={6}>
                                                                <Card size='small'>
                                                                    <Statistic
                                                                        title='voiced_prob≥0.25 비율'
                                                                        value={`${(item.audioFeatures.voiced_prob_ge_025_ratio * 100).toFixed(1)}%`}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                        {typeof item.audioFeatures
                                                            .voiced_prob_ge_035_ratio ===
                                                            'number' && (
                                                            <Col xs={24} sm={12} md={6}>
                                                                <Card size='small'>
                                                                    <Statistic
                                                                        title='voiced_prob≥0.35 비율'
                                                                        value={`${(item.audioFeatures.voiced_prob_ge_035_ratio * 100).toFixed(1)}%`}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                        {typeof item.audioFeatures
                                                            .f0_valid_ratio === 'number' && (
                                                            <Col xs={24} sm={12} md={6}>
                                                                <Card size='small'>
                                                                    <Statistic
                                                                        title='f0_valid_ratio'
                                                                        value={`${(item.audioFeatures.f0_valid_ratio * 100).toFixed(1)}%`}
                                                                    />
                                                                </Card>
                                                            </Col>
                                                        )}
                                                        {typeof item.audioFeatures.voiced_frames ===
                                                            'number' &&
                                                            typeof item.audioFeatures
                                                                .total_frames === 'number' && (
                                                                <Col xs={24} sm={12} md={6}>
                                                                    <Card size='small'>
                                                                        <Statistic
                                                                            title='frames (voiced/total)'
                                                                            value={`${item.audioFeatures.voiced_frames}/${item.audioFeatures.total_frames}`}
                                                                        />
                                                                    </Card>
                                                                </Col>
                                                            )}
                                                        {typeof item.audioFeatures.speech_frames ===
                                                            'number' &&
                                                            typeof item.audioFeatures
                                                                .total_frames === 'number' && (
                                                                <Col xs={24} sm={12} md={6}>
                                                                    <Card size='small'>
                                                                        <Statistic
                                                                            title='frames (speech/total)'
                                                                            value={`${item.audioFeatures.speech_frames}/${item.audioFeatures.total_frames}`}
                                                                        />
                                                                    </Card>
                                                                </Col>
                                                            )}
                                                    </Row>
                                                </>
                                            )}
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    </Card>
                )}

                {/* 추천사항 */}
                <Card id='recommend' title='추천사항' className='!border-0 !shadow-lg mb-8'>
                    <List
                        dataSource={analysisResult.recommendations}
                        renderItem={(item) => (
                            <List.Item>
                                <BulbOutlined className='text-yellow-500 mr-2' />
                                <Text>{item}</Text>
                            </List.Item>
                        )}
                    />
                </Card>

                {/* 액션 버튼 */}
                <div className='text-center'>
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
            {/* 인쇄 전용 스타일 */}
            <style>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .ant-card { break-inside: avoid; }
                }
            `}</style>
        </div>
    );
}
