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
} from '@ant-design/icons';
import Link from 'next/link';

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

            if (storedAnalysis && storedQA) {
                const analysis = JSON.parse(storedAnalysis);
                const qa = JSON.parse(storedQA);

                // API 실패 여부 확인
                if (analysis.error) setAnalysisError(analysis);
                else setAnalysisResult(analysis);

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
                setError('면접 결과 데이터를 찾을 수 없습니다.');
                setLoading(false);
            }
        } catch (err) {
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
            setLoading(false);
        }
    }, []);

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
            const baseCv = typeof a.f0_cv === 'number' ? a.f0_cv : a.f0_mean ? (a.f0_std ?? 0) / a.f0_mean : undefined;
            return {
                baseTalk: typeof baseTalk === 'number' && isFinite(baseTalk) ? baseTalk : 0.6,
                baseCv: typeof baseCv === 'number' && isFinite(baseCv) && baseCv > 0 ? baseCv : 0.12,
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
            const lo = 0.05, hi = 0.35;
            const t = Math.min(1, Math.max(0, (cv - lo) / (hi - lo)));
            return Math.round((1 - t) * 100);
        }

        // 2) 세미톤 표준편차 보조: 1.0 → 100, 5.0 → 0
        if (typeof f.f0_std_semitone === 'number' && f.f0_std_semitone >= 0) {
            const st = f.f0_std_semitone;
            const lo = 1.0, hi = 5.0;
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
                                                            <ClockCircleOutlined /> {pc.label} ({
                                                                Math.round(pc.talk * 100)
                                                            }% 발화)
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
                <div className='text-center mb-8'>
                    <Title level={1} className='!text-4xl !font-bold !text-gray-800 mb-4'>
                        <TrophyOutlined className='mr-3 text-yellow-500' />
                        AI 면접 결과 분석
                    </Title>
                    <Paragraph className='!text-lg !text-gray-600 max-w-2xl mx-auto'>
                        ChatGPT AI가 분석한 면접 결과를 확인해보세요.
                    </Paragraph>
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

                {/* 상세 점수 */}
                <Row gutter={[24, 24]} className='mb-8'>
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
                <Card title='종합 평가' className='!border-0 !shadow-lg mb-8'>
                    <Paragraph className='!text-lg !leading-relaxed'>
                        {analysisResult.overall_evaluation}
                    </Paragraph>
                </Card>

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
                <Card title='질문별 상세 피드백' className='!border-0 !shadow-lg mb-8'>
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
                    <Card title='질문별 음성 분석 상세' className='!border-0 !shadow-lg mb-8'>
                        <List
                            dataSource={audioPerQuestion}
                            renderItem={(item) => {
                                const tone = toneScore(item.audioFeatures as AudioFeatures);
                                const vib = vibratoScore(item.audioFeatures as AudioFeatures);
                                const pace = paceScore(item.audioFeatures as AudioFeatures);
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
                                                        const pc = paceClass(item.audioFeatures as AudioFeatures);
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
                                                    <Row gutter={[16, 16]}>
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
                <Card title='추천사항' className='!border-0 !shadow-lg mb-8'>
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
        </div>
    );
}
