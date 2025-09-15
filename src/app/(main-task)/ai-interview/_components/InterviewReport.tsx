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
    // NEW: 백엔드 텍스트(내용/맥락) 분석 요약
    text_analysis_summary?: {
        content_avg100: number;
        context_avg100: number;
        overall_llm10: number;
        top_reasons?: string[];
        top_improvements?: string[];
    };
    // NEW: 상위 근거 링크
    evidence_links?: Array<{
        answer_span: string;
        resume_ref?: string;
        similarity?: number;
        explanation?: string;
    }>;
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
    // NEW: 문항별 텍스트 분석(옵션)
    perQuestionTextAnalyses?: Array<{
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
    }>;
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
    // 비교용 (선택)
    viewMode?: 'raw' | 'compare';
    calibrationCompare?: {
        visual?: {
            baseline?: any;
            normalizedOverall?: any;
            normalizedPerQuestion?: Record<string, any> | null;
            serverQuestionScores?: Record<string, { score: number; calibrationApplied?: boolean }> | null;
        };
        audio?: {
            baseline?: any;
            ratiosOverall?: Record<string, number> | null;
            ratiosPerQuestion?: Record<string, Record<string, number>> | null;
        };
    };
}

export default function InterviewReport({
    analysisResult,
    qaList = [],
    audioData,
    visualData,
    sessionMeta,
    perQuestionTextAnalyses,
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
    viewMode = 'raw',
    calibrationCompare,
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

    // 숫자 포맷 보조
    const fmt = (n: any, digits: number = 3) => {
        if (n == null || Number.isNaN(Number(n))) return '-';
        const num = Number(n);
        if (!Number.isFinite(num)) return '-';
        return Number(num.toFixed(digits));
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

            {/* 텍스트 분석 요약 (내용/맥락) */}
            {analysisResult.text_analysis_summary && (
                <Card className='!border-0 !shadow-lg mb-8' title='텍스트 분석 요약(내용·맥락)'>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='text-center mb-2'>LLM 종합</div>
                                <div
                                    className='text-4xl font-bold'
                                    style={{
                                        color: getScoreColor(
                                            (analysisResult.text_analysis_summary.overall_llm10 || 0) * 10,
                                        ),
                                    }}
                                >
                                    {analysisResult.text_analysis_summary.overall_llm10 || 0}
                                    <span className='text-base ml-1'>/ 10</span>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='mb-2'>내용 적합도</div>
                                <Progress
                                    percent={analysisResult.text_analysis_summary.content_avg100 || 0}
                                    strokeColor={getScoreColor(
                                        analysisResult.text_analysis_summary.content_avg100 || 0,
                                    )}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card size='small'>
                                <div className='mb-2'>맥락 일치도</div>
                                <Progress
                                    percent={analysisResult.text_analysis_summary.context_avg100 || 0}
                                    strokeColor={getScoreColor(
                                        analysisResult.text_analysis_summary.context_avg100 || 0,
                                    )}
                                />
                            </Card>
                        </Col>
                    </Row>
                    <Divider />
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <div className='mb-2 font-semibold'>상위 근거</div>
                            <List
                                size='small'
                                dataSource={analysisResult.text_analysis_summary.top_reasons || []}
                                locale={{ emptyText: '근거 정보 없음' }}
                                renderItem={(item) => (
                                    <List.Item>
                                        <Space>
                                            <CheckCircleOutlined className='text-green-500' />
                                            <span>{item}</span>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <div className='mb-2 font-semibold'>개선 팁</div>
                            <List
                                size='small'
                                dataSource={analysisResult.text_analysis_summary.top_improvements || []}
                                locale={{ emptyText: '개선 팁 없음' }}
                                renderItem={(item) => (
                                    <List.Item>
                                        <Space>
                                            <RiseOutlined className='text-blue-500' />
                                            <span>{item}</span>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Col>
                    </Row>
                    {!!analysisResult.evidence_links?.length && (
                        <>
                            <Divider />
                            <div className='mb-2 font-semibold'>근거 하이라이트</div>
                            <List
                                size='small'
                                dataSource={analysisResult.evidence_links}
                                renderItem={(link) => (
                                    <List.Item>
                                        <Space direction='vertical' size={0} style={{ width: '100%' }}>
                                            <div>
                                                <Tag color='green'>답변</Tag>
                                                <Text>{link.answer_span}</Text>
                                            </div>
                                            {link.resume_ref && (
                                                <div>
                                                    <Tag color='blue'>이력서</Tag>
                                                    <Text>{link.resume_ref}</Text>
                                                </div>
                                            )}
                                            <div className='text-xs text-gray-500'>
                                                유사도: {fmt(link.similarity ?? '-', 3)}
                                                {link.explanation ? ` · ${link.explanation}` : ''}
                                            </div>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </>
                    )}
                </Card>
            )}

            {/* 문항별 텍스트 상세 */}
            {Array.isArray(perQuestionTextAnalyses) && perQuestionTextAnalyses.length > 0 && (
                <Card className='!border-0 !shadow-lg mb-8' title='문항별 텍스트 상세'>
                    <List
                        itemLayout='vertical'
                        dataSource={perQuestionTextAnalyses}
                        renderItem={(item, idx) => {
                            const qText = qaList?.[idx]?.question || `질문 ${idx + 1}`;
                            const content = item.content;
                            const context = item.context;
                            const contradiction = !!context?.consistency?.contradiction;
                            return (
                                <List.Item key={item.questionId}>
                                    <Card size='small' className='!border !border-gray-100'>
                                        <div className='mb-2 flex items-center justify-between'>
                                            <div className='font-semibold text-gray-800'>
                                                {qText}
                                            </div>
                                            <Space>
                                                {typeof content?.content_score === 'number' && (
                                                    <Tag color={getScoreColor(content.content_score)}>
                                                        내용 {content.content_score}
                                                    </Tag>
                                                )}
                                                {typeof context?.context_score === 'number' && (
                                                    <Tag color={getScoreColor(context.context_score)}>
                                                        맥락 {context.context_score}
                                                    </Tag>
                                                )}
                                                {contradiction && (
                                                    <Tag color='red' icon={<WarningOutlined />}>모순 감지</Tag>
                                                )}
                                            </Space>
                                        </div>
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} md={12}>
                                                <div className='mb-2 font-semibold'>근거</div>
                                                <List
                                                    size='small'
                                                    dataSource={content?.reasoning || []}
                                                    locale={{ emptyText: '근거 없음' }}
                                                    renderItem={(r) => (
                                                        <List.Item>
                                                            <Space>
                                                                <CheckCircleOutlined className='text-green-500' />
                                                                <span>{r}</span>
                                                            </Space>
                                                        </List.Item>
                                                    )}
                                                />
                                                {!!content?.star && (
                                                    <div className='mt-2 text-xs text-gray-600'>
                                                        <div>Situation: {content.star.situation || '-'}</div>
                                                        <div>Task: {content.star.task || '-'}</div>
                                                        <div>Action: {content.star.action || '-'}</div>
                                                        <div>Result: {content.star.result || '-'}</div>
                                                    </div>
                                                )}
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <div className='mb-2 font-semibold'>개선 팁</div>
                                                <List
                                                    size='small'
                                                    dataSource={content?.improvements || []}
                                                    locale={{ emptyText: '개선 팁 없음' }}
                                                    renderItem={(im) => (
                                                        <List.Item>
                                                            <Space>
                                                                <RiseOutlined className='text-blue-500' />
                                                                <span>{im}</span>
                                                            </Space>
                                                        </List.Item>
                                                    )}
                                                />
                                                <Divider className='my-3' />
                                                <div className='mb-2 font-semibold'>근거 링크</div>
                                                <List
                                                    size='small'
                                                    dataSource={context?.links || []}
                                                    locale={{ emptyText: '링크 없음' }}
                                                    renderItem={(lnk) => (
                                                        <List.Item>
                                                            <Space direction='vertical' size={0} style={{ width: '100%' }}>
                                                                <div>
                                                                    <Tag color='green'>답변</Tag>
                                                                    <Text>{lnk.answer_span}</Text>
                                                                </div>
                                                                {lnk.resume_ref && (
                                                                    <div>
                                                                        <Tag color='blue'>이력서</Tag>
                                                                        <Text>{lnk.resume_ref}</Text>
                                                                    </div>
                                                                )}
                                                                <div className='text-xs text-gray-500'>
                                                                    유사도: {fmt(lnk.similarity ?? '-', 3)}
                                                                    {lnk.explanation ? ` · ${lnk.explanation}` : ''}
                                                                </div>
                                                            </Space>
                                                        </List.Item>
                                                    )}
                                                />
                                            </Col>
                                        </Row>
                                    </Card>
                                </List.Item>
                            );
                        }}
                    />
                </Card>
            )}

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

            {/* 질문별 비주얼 비교 (캘리브레이션) */}
            {displayOptions.showVisualAnalysis &&
                calibrationCompare?.visual?.normalizedPerQuestion &&
                visualData?.perQuestion && (
                    <Card title='질문별 비주얼 비교' className='!border-0 !shadow-lg mb-8'>
                        <List
                            dataSource={Object.keys(visualData.perQuestion)}
                            renderItem={(qid, idx) => {
                                const raw = (visualData.perQuestion as any)[qid] || {};
                                const norm = calibrationCompare?.visual?.normalizedPerQuestion?.[qid];
                                const svr = calibrationCompare?.visual?.serverQuestionScores?.[qid];
                                return (
                                    <List.Item>
                                        <div className='w-full'>
                                            <div className='flex justify-between items-start mb-2'>
                                                <Text strong>Q{idx + 1} ({qid})</Text>
                                                {svr?.score != null && (
                                                    <Tag color={getScoreColor(svr.score)}>
                                                        정규화 {svr.score.toFixed(0)}
                                                        {svr.calibrationApplied ? ' ✓' : ''}
                                                    </Tag>
                                                )}
                                            </div>
                                            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                                <Card size='small'>
                                                    <div className='text-gray-500 text-sm mb-1'>Raw</div>
                                                    <div className='text-sm'>confidence_mean: {fmt(raw?.confidence_mean)}</div>
                                                    <div className='text-sm'>smile_mean: {fmt(raw?.smile_mean)}</div>
                                                </Card>
                                                <Card size='small'>
                                                    <div className='text-gray-500 text-sm mb-1'>Calibrated</div>
                                                    <div className='text-sm'>confidence_mean: {fmt(norm?.confidence_mean)}</div>
                                                    <div className='text-sm'>smile_mean: {fmt(norm?.smile_mean)}</div>
                                                </Card>
                                                <Card size='small'>
                                                    <div className='text-gray-500 text-sm mb-1'>Presence/Level</div>
                                                    <div className='text-xs text-gray-600'>good/avg/need: {raw?.presence_dist ? `${raw.presence_dist.good}/${raw.presence_dist.average}/${raw.presence_dist.needs_improvement}` : '-'}</div>
                                                    <div className='text-xs text-gray-600'>warn/crit: {raw?.level_dist ? `${raw.level_dist.warning}/${raw.level_dist.critical}` : '-'}</div>
                                                </Card>
                                            </div>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    </Card>
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
                                                {typeof (item as any).normalized_score === 'number' && (
                                                    <Tag color={getScoreColor((item as any).normalized_score as number)}>
                                                        <ThunderboltOutlined /> 정규화{' '}
                                                        {((item as any).normalized_score as number).toFixed(2)}
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
                                    {calibrationCompare?.audio?.ratiosPerQuestion && (
                                        (() => {
                                            const key = String(item.questionNumber);
                                            const ratios = calibrationCompare?.audio?.ratiosPerQuestion?.[key];
                                            if (!ratios) return null;
                                            return (
                                                <div className='mt-2 text-xs text-gray-600'>
                                                    <span className='mr-2'>정규화 비율:</span>
                                                    <Space size={8} wrap>
                                                        {'f0_mean' in ratios && (
                                                            <Tag>f0 {fmt(ratios.f0_mean)}</Tag>
                                                        )}
                                                        {'f0_std' in ratios && (
                                                            <Tag>f0σ {fmt(ratios.f0_std)}</Tag>
                                                        )}
                                                        {'rms_cv' in ratios && (
                                                            <Tag>rms_cv {fmt(ratios.rms_cv)}</Tag>
                                                        )}
                                                        {'jitter_like' in ratios && (
                                                            <Tag>jitter {fmt(ratios.jitter_like)}</Tag>
                                                        )}
                                                        {'shimmer_like' in ratios && (
                                                            <Tag>shimmer {fmt(ratios.shimmer_like)}</Tag>
                                                        )}
                                                        {'silence_ratio' in ratios && (
                                                            <Tag>silence {fmt(ratios.silence_ratio)}</Tag>
                                                        )}
                                                    </Space>
                                                </div>
                                            );
                                        })()
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
