// components/InterviewReport.tsx
'use client';

import { useState } from 'react';
import {
    Card,
    Typography,
    Progress,
    Row,
    Col,
    Statistic,
    List,
    Tag,
    Space,
    Divider,
    Button,
    Alert,
} from 'antd';
import {
    CheckCircleOutlined,
    MessageOutlined,
    BulbOutlined,
    EyeOutlined,
    TrophyOutlined,
    StarOutlined,
    RiseOutlined,
    WarningOutlined,
    DownloadOutlined,
    LinkOutlined,
    SoundOutlined,
    SmileOutlined,
    AudioOutlined,
    ClockCircleOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

// 서버 리포트 데이터 타입
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

// 서버에서 계산된 음성/영상 데이터 타입
interface AudioAnalysisData {
    overall?: {
        // 원시 지표
        f0_mean?: number;
        f0_std?: number;
        f0_cv?: number;
        rms_cv?: number;
        jitter_like?: number;
        shimmer_like?: number;
        silence_ratio?: number;
        // 서버 계산 점수
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
        // 서버 계산 점수
        confidence_score?: number;
        behavior_score?: number;
        overall_visual_score?: number;
    };
    perQuestion?: Record<string, any>;
}

interface InterviewReportProps {
    analysisResult: InterviewAnalysisResult;
    qaList?: QAPair[];
    audioData?: AudioAnalysisData;
    visualData?: VisualAnalysisData;
    sessionMeta?: {
        sessionId: string;
        createdAt?: string;
        duration?: number;
    };
    displayOptions?: {
        showHeader?: boolean;
        showActions?: boolean;
        showDetailedFeedback?: boolean;
        showAudioAnalysis?: boolean;
        showVisualAnalysis?: boolean;
        compact?: boolean;
    };
    onPrint?: () => void;
    onShare?: () => void;
}

export default function InterviewReport({
    analysisResult,
    qaList = [],
    audioData,
    visualData,
    sessionMeta,
    displayOptions = {
        showHeader: true,
        showActions: true,
        showDetailedFeedback: true,
        showAudioAnalysis: true,
        showVisualAnalysis: true,
        compact: false,
    },
    onPrint,
    onShare,
}: InterviewReportProps) {
    const [showFullFeedback, setShowFullFeedback] = useState(!displayOptions.compact);
    const [showAudioDetails, setShowAudioDetails] = useState(false);
    const [showVisualDetails, setShowVisualDetails] = useState(false);

    // 점수 관련 유틸리티 함수들
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

    const pct = (n?: number | null, total?: number | null) => {
        if (!n || !total || total <= 0) return '0%';
        return `${((n / total) * 100).toFixed(0)}%`;
    };

    const handlePrint = () => {
        if (onPrint) {
            onPrint();
        } else if (typeof window !== 'undefined') {
            window.print();
        }
    };

    const handleShare = async () => {
        if (onShare) {
            onShare();
        } else {
            try {
                const url = typeof window !== 'undefined' ? window.location.href : '';
                await navigator.clipboard.writeText(url);
            } catch (e) {
                console.log('Share failed');
            }
        }
    };

    return (
        <div className={`interview-report ${displayOptions.compact ? 'compact' : ''}`}>
            {/* 헤더 */}
            {displayOptions.showHeader && (
                <div className='text-center mb-8'>
                    <Title level={displayOptions.compact ? 3 : 1} className='!text-gray-800 mb-4'>
                        <TrophyOutlined className='mr-3 text-yellow-500' />
                        AI 모의면접 결과 리포트
                    </Title>
                    {sessionMeta && (
                        <div className='text-sm text-gray-500 mb-4'>
                            <div>세션 ID: {sessionMeta.sessionId}</div>
                            {sessionMeta.createdAt && (
                                <div>
                                    면접 일시:{' '}
                                    {new Date(sessionMeta.createdAt).toLocaleString('ko-KR')}
                                </div>
                            )}
                        </div>
                    )}
                    {displayOptions.showActions && (
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
                    )}
                </div>
            )}

            {/* 전체 점수 카드 */}
            <Card className='!border-0 !shadow-lg mb-8'>
                <div className='text-center'>
                    <div className='flex items-center justify-center mb-4'>
                        {getScoreIcon(analysisResult.overall_score)}
                        <div
                            className={`${displayOptions.compact ? 'text-4xl' : 'text-6xl'} font-bold ml-4`}
                            style={{ color: getScoreColor(analysisResult.overall_score) }}
                        >
                            {analysisResult.overall_score}점
                        </div>
                    </div>
                    <Title level={displayOptions.compact ? 4 : 2} className='!text-gray-800 mb-2'>
                        {getScoreLevel(analysisResult.overall_score)}
                    </Title>
                    <Progress
                        percent={analysisResult.overall_score}
                        strokeColor={getScoreColor(analysisResult.overall_score)}
                        className='max-w-md mx-auto'
                    />
                </div>
            </Card>

            {/* 세부 점수 */}
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

            {/* 음성/영상 분석 요약 카드 */}
            {(audioData?.overall || visualData?.overall) && (
                <Row gutter={[24, 24]} className='mb-8'>
                    {audioData?.overall && displayOptions.showAudioAnalysis && (
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
                                                {audioData.overall.overall_voice_score
                                                    ? getScoreLevel(
                                                          audioData.overall.overall_voice_score,
                                                      )
                                                    : '보통'}
                                            </span>
                                        </div>
                                        <div className='text-gray-600'>
                                            {(() => {
                                                const scores = audioData.overall;
                                                const parts = [];
                                                if (scores.tone_score && scores.tone_score >= 80)
                                                    parts.push('안정적인 톤');
                                                if (
                                                    scores.vibrato_score &&
                                                    scores.vibrato_score >= 80
                                                )
                                                    parts.push('떨림 적음');
                                                if (scores.pace_score && scores.pace_score >= 80)
                                                    parts.push('적정 속도');

                                                return parts.length > 0
                                                    ? `${parts.join(' · ')}로 발화했습니다.`
                                                    : '톤 안정화와 속도 조절 연습을 권합니다.';
                                            })()}
                                        </div>
                                        <div className='mt-3'>
                                            <Button
                                                size='small'
                                                onClick={() =>
                                                    setShowAudioDetails(!showAudioDetails)
                                                }
                                            >
                                                {showAudioDetails ? '지표 닫기' : '지표 확인하기'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    )}

                    {visualData?.overall && displayOptions.showVisualAnalysis && (
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
                                                {visualData.overall.overall_visual_score
                                                    ? getScoreLevel(
                                                          visualData.overall.overall_visual_score,
                                                      )
                                                    : '보통'}
                                            </span>
                                        </div>
                                        <div className='text-gray-600'>
                                            {(() => {
                                                const v = visualData.overall;
                                                const count = v.count || 0;
                                                const good =
                                                    count && v.presence_dist?.good
                                                        ? v.presence_dist.good / count
                                                        : 0;
                                                return `전체 면접 중 약 ${Math.round(good * 100)}%의 시간이 자신감 있는 모습으로 진행되었습니다.`;
                                            })()}
                                        </div>
                                        <div className='mt-3'>
                                            <Button
                                                size='small'
                                                onClick={() =>
                                                    setShowVisualDetails(!showVisualDetails)
                                                }
                                            >
                                                {showVisualDetails ? '지표 닫기' : '지표 확인하기'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    )}
                </Row>
            )}

            {/* 상세 음성 지표 */}
            {audioData?.overall && showAudioDetails && displayOptions.showAudioAnalysis && (
                <Card title='종합 음성 지표' className='!border-0 !shadow-lg mb-8'>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='text-center mb-4'>
                                    <div className='text-base text-gray-600 mb-2'>톤 안정성</div>
                                    <div
                                        className='text-4xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                audioData.overall.tone_score || 70,
                                            ),
                                        }}
                                    >
                                        {audioData.overall.tone_score || '-'}
                                    </div>
                                </div>
                                <Statistic
                                    title='평균 f0_mean (Hz)'
                                    value={audioData.overall.f0_mean?.toFixed(1) || '-'}
                                />
                                <Statistic
                                    title='평균 f0_std (Hz)'
                                    value={audioData.overall.f0_std?.toFixed(2) || '-'}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='text-center mb-4'>
                                    <div className='text-base text-gray-600 mb-2'>목소리 떨림</div>
                                    <div
                                        className='text-4xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                audioData.overall.vibrato_score || 70,
                                            ),
                                        }}
                                    >
                                        {audioData.overall.vibrato_score || '-'}
                                    </div>
                                </div>
                                <Statistic
                                    title='평균 jitter_like'
                                    value={audioData.overall.jitter_like?.toFixed(3) || '-'}
                                />
                                <Statistic
                                    title='평균 shimmer_like'
                                    value={audioData.overall.shimmer_like?.toFixed(3) || '-'}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='text-center mb-4'>
                                    <div className='text-base text-gray-600 mb-2'>말 빠르기</div>
                                    <div
                                        className='text-4xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                audioData.overall.pace_score || 70,
                                            ),
                                        }}
                                    >
                                        {audioData.overall.pace_score || '-'}
                                    </div>
                                </div>
                                <Statistic
                                    title='평균 침묵 비율'
                                    value={
                                        audioData.overall.silence_ratio
                                            ? `${(audioData.overall.silence_ratio * 100).toFixed(1)}%`
                                            : '-'
                                    }
                                />
                                <Statistic
                                    title='평균 rms_cv'
                                    value={audioData.overall.rms_cv?.toFixed(3) || '-'}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Card>
            )}

            {/* 상세 영상 지표 */}
            {visualData?.overall && showVisualDetails && displayOptions.showVisualAnalysis && (
                <Card title='종합 영상 지표' className='!border-0 !shadow-lg mb-8'>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='text-center mb-4'>
                                    <div className='text-base text-gray-600 mb-2'>자신감 점수</div>
                                    <div
                                        className='text-4xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                visualData.overall.confidence_score || 70,
                                            ),
                                        }}
                                    >
                                        {visualData.overall.confidence_score || '-'}
                                    </div>
                                </div>
                                <Statistic
                                    title='평균 자신감'
                                    value={
                                        visualData.overall.confidence_mean
                                            ? (visualData.overall.confidence_mean * 100).toFixed(0)
                                            : '-'
                                    }
                                />
                                <Statistic title='샘플 수' value={visualData.overall.count || 0} />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='text-center mb-4'>
                                    <div className='text-base text-gray-600 mb-2'>행동 점수</div>
                                    <div
                                        className='text-4xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                visualData.overall.behavior_score || 70,
                                            ),
                                        }}
                                    >
                                        {visualData.overall.behavior_score || '-'}
                                    </div>
                                </div>
                                <Statistic
                                    title='미소 평균'
                                    value={
                                        visualData.overall.smile_mean
                                            ? (visualData.overall.smile_mean * 100).toFixed(0)
                                            : '-'
                                    }
                                />
                                <Statistic
                                    title='presence good'
                                    value={pct(
                                        visualData.overall.presence_dist?.good,
                                        visualData.overall.count,
                                    )}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='text-center mb-4'>
                                    <div className='text-base text-gray-600 mb-2'>
                                        주의/경고 비중
                                    </div>
                                    <div className='text-4xl font-bold text-red-500'>
                                        {pct(
                                            (visualData.overall.level_dist?.warning || 0) +
                                                (visualData.overall.level_dist?.critical || 0),
                                            visualData.overall.count,
                                        )}
                                    </div>
                                </div>
                                <Statistic
                                    title='경고 (warn)'
                                    value={visualData.overall.level_dist?.warning || 0}
                                />
                                <Statistic
                                    title='치명 (critical)'
                                    value={visualData.overall.level_dist?.critical || 0}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Card>
            )}

            {/* 질문별 음성 분석 (간략) */}
            {audioData?.perQuestion &&
                audioData.perQuestion.length > 0 &&
                displayOptions.showAudioAnalysis && (
                    <Card title='질문별 음성 분석' className='!border-0 !shadow-lg mb-8'>
                        <List
                            dataSource={audioData.perQuestion}
                            renderItem={(item) => (
                                <List.Item>
                                    <div className='w-full'>
                                        <div className='flex justify-between items-start mb-3'>
                                            <Text strong className='text-lg'>
                                                Q{item.questionNumber}. {item.question}
                                            </Text>
                                            <Space>
                                                {typeof item.tone_score === 'number' && (
                                                    <Tag color={getScoreColor(item.tone_score)}>
                                                        <SoundOutlined /> 톤 {item.tone_score}
                                                    </Tag>
                                                )}
                                                {typeof item.vibrato_score === 'number' && (
                                                    <Tag color={getScoreColor(item.vibrato_score)}>
                                                        <AudioOutlined /> 떨림 {item.vibrato_score}
                                                    </Tag>
                                                )}
                                                {typeof item.pace_score === 'number' && (
                                                    <Tag color={getScoreColor(item.pace_score)}>
                                                        <ClockCircleOutlined /> 속도{' '}
                                                        {item.pace_score}
                                                    </Tag>
                                                )}
                                            </Space>
                                        </div>
                                        {item.audioUrl && (
                                            <audio
                                                controls
                                                src={item.audioUrl}
                                                className='w-full'
                                            />
                                        )}
                                    </div>
                                </List.Item>
                            )}
                        />
                    </Card>
                )}

            {/* 종합 평가 */}
            <Card title='종합 평가' className='!border-0 !shadow-lg mb-8'>
                <Paragraph
                    className={`${displayOptions.compact ? '!text-base' : '!text-lg'} !leading-relaxed`}
                >
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
            {displayOptions.showDetailedFeedback && (
                <Card
                    title={
                        <div className='flex justify-between items-center'>
                            <span>질문별 상세 피드백</span>
                            {displayOptions.compact && (
                                <Button
                                    size='small'
                                    onClick={() => setShowFullFeedback(!showFullFeedback)}
                                >
                                    {showFullFeedback ? '접기' : '펼치기'}
                                </Button>
                            )}
                        </div>
                    }
                    className='!border-0 !shadow-lg mb-8'
                >
                    {(!displayOptions.compact || showFullFeedback) && (
                        <div>
                            {qaList.length > 0 ? (
                                <List<QAPair>
                                    dataSource={qaList}
                                    renderItem={(qa, index) => {
                                        const questionKey = `question_${index + 1}`;
                                        const feedback =
                                            analysisResult.detailed_feedback[questionKey];

                                        return (
                                            <List.Item>
                                                <div className='w-full'>
                                                    <div className='flex justify-between items-start mb-3'>
                                                        <Text strong className='text-lg'>
                                                            Q{index + 1}. {qa.question}
                                                        </Text>
                                                        {feedback && (
                                                            <Tag
                                                                color={getScoreColor(
                                                                    feedback.score * 10,
                                                                )}
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
                                                                <strong>AI 피드백:</strong>{' '}
                                                                {feedback.feedback}
                                                            </Text>
                                                        </div>
                                                    )}
                                                </div>
                                            </List.Item>
                                        );
                                    }}
                                />
                            ) : (
                                <List<string>
                                    dataSource={Object.keys(analysisResult.detailed_feedback)}
                                    renderItem={(questionKey, index) => {
                                        const feedback =
                                            analysisResult.detailed_feedback[questionKey];
                                        const question = feedback?.question || `질문 ${index + 1}`;

                                        return (
                                            <List.Item>
                                                <div className='w-full'>
                                                    <div className='flex justify-between items-start mb-3'>
                                                        <Text strong className='text-lg'>
                                                            Q{index + 1}. {question}
                                                        </Text>
                                                        {feedback && (
                                                            <Tag
                                                                color={getScoreColor(
                                                                    feedback.score * 10,
                                                                )}
                                                                className='text-sm'
                                                            >
                                                                {feedback.score}/10점
                                                            </Tag>
                                                        )}
                                                    </div>
                                                    {feedback && (
                                                        <div className='bg-blue-50 p-4 rounded-lg'>
                                                            <Text className='text-sm'>
                                                                <strong>AI 피드백:</strong>{' '}
                                                                {feedback.feedback}
                                                            </Text>
                                                        </div>
                                                    )}
                                                </div>
                                            </List.Item>
                                        );
                                    }}
                                />
                            )}
                        </div>
                    )}
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

            {/* 인쇄용 스타일 */}
            <style jsx>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                    .ant-card {
                        break-inside: avoid;
                    }
                }
                .interview-report.compact .ant-card {
                    margin-bottom: 16px;
                }
            `}</style>
        </div>
    );
}
