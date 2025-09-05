'use client';

import { useState, useEffect } from 'react';
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
    jitter_like: number;
    shimmer_like: number;
    silence_ratio: number;
    sr: number;
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
    const toneScore = (f: AudioFeatures | undefined) => {
        if (!f) return undefined;
        if (Number.isFinite(f.f0_std_semitone) && (f.f0_std_semitone as number) > 0) {
            const st = f.f0_std_semitone as number; // 세미톤 표준편차(강건)
            const lo = 0.15,
                hi = 0.9; // 0.15→100점, 0.90→0점
            const t = Math.min(1, Math.max(0, (st - lo) / (hi - lo)));
            return Math.round((1 - t) * 100);
        }
        if (Number.isFinite(f.f0_cv) && (f.f0_cv as number) > 0) {
            const cv = f.f0_cv as number; // CV 0.05→100, 0.30→0
            const lo = 0.05,
                hi = 0.3;
            const t = Math.min(1, Math.max(0, (cv - lo) / (hi - lo)));
            return Math.round((1 - t) * 100);
        }
        const std = f.f0_std; // 폴백: 절대 표준편차
        const t = Math.min(1, std / 120);
        return Math.round((1 - t) * 100);
    };
    const vibratoScore = (f: AudioFeatures | undefined) => {
        if (!f) return undefined;
        const nj = Math.min(1, (f.jitter_like ?? 0) / 1.0);
        const ns = Math.min(1, (f.shimmer_like ?? 0) / 1.0);
        const nr = Math.min(1, (f.rms_cv ?? 0) / 2.0);
        const bad = nj * 0.4 + ns * 0.4 + nr * 0.2;
        return Math.round((1 - bad) * 100);
    };
    const paceScore = (f: AudioFeatures | undefined) => {
        if (!f) return undefined;
        const talk = 1 - (f.silence_ratio ?? 0);
        const target = 0.6;
        const err = Math.abs(talk - target) / target;
        return Math.round((1 - clamp01(err)) * 100);
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
                                                                    title='rms_cv'
                                                                    value={item.audioFeatures.rms_cv?.toFixed(
                                                                        3,
                                                                    )}
                                                                />
                                                            </Card>
                                                        </Col>
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
                                            title='평균 rms_cv'
                                            value={(audioOverall.rms_cv ?? 0).toFixed(3)}
                                        />
                                    </Card>
                                </Col>
                            </Row>
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
                                                                    title='presence: good'
                                                                    value={pct(
                                                                        v.presence_dist.good,
                                                                        v.count,
                                                                    )}
                                                                />
                                                                <Statistic
                                                                    title='presence: avg'
                                                                    value={pct(
                                                                        v.presence_dist.average,
                                                                        v.count,
                                                                    )}
                                                                />
                                                                <Statistic
                                                                    title='presence: needs'
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
                                                                    title='level: ok'
                                                                    value={pct(
                                                                        v.level_dist.ok,
                                                                        v.count,
                                                                    )}
                                                                />
                                                                <Statistic
                                                                    title='level: warn'
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
                                                                    title='conf_mean'
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
                                                                    title='smile_mean'
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
                                        title='평균 rms_cv'
                                        value={(audioOverall.rms_cv ?? 0).toFixed(3)}
                                    />
                                </Card>
                            </Col>
                        </Row>
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
                                                                title='rms_cv'
                                                                value={item.audioFeatures.rms_cv.toFixed(
                                                                    3,
                                                                )}
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
                                                </Row>
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
