// components/InterviewReport.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
    CheckCircle,
    MessageCircle,
    Lightbulb,
    Eye,
    Trophy,
    Star,
    TrendingUp,
    AlertTriangle,
    Download,
    Link,
    Volume2,
    Smile,
    Mic,
    Clock,
    Zap,
} from 'lucide-react';

import type { InterviewAnalysisResult } from '@/types/report';

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
            serverQuestionScores?: Record<
                string,
                { score: number; calibrationApplied?: boolean }
            > | null;
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

    // 부분 점수(30/30/40)를 퍼센트(0-100)로 환산
    const pctOf = (v: number | undefined, max: number) => {
        const n = typeof v === 'number' ? v : 0;
        const clamped = Math.max(0, Math.min(max, n));
        return Math.round((clamped / max) * 100);
    };

    const getScoreLevel = (score: number) => {
        if (score >= 90) return '우수';
        if (score >= 80) return '양호';
        if (score >= 70) return '보통';
        return '개선 필요';
    };

    const getScoreIcon = (score: number) => {
        if (score >= 90) return <Trophy className='text-yellow-500' />;
        if (score >= 80) return <Star className='text-blue-500' />;
        if (score >= 70) return <CheckCircle className='text-orange-500' />;
        return <AlertTriangle className='text-red-500' />;
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
                    <h1
                        className={`${displayOptions.compact ? 'text-3xl' : 'text-5xl'} font-bold text-gray-800 mb-4 flex items-center justify-center gap-3`}
                    >
                        <Trophy className='text-yellow-500' />
                        AI 모의면접 결과 리포트
                    </h1>
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
                        <div className='mt-4 print:hidden flex gap-3 justify-center'>
                            <Button onClick={handlePrint} className='flex items-center gap-2'>
                                <Download className='w-4 h-4' />
                                PDF로 저장/인쇄
                            </Button>
                            <Button
                                variant='outline'
                                onClick={handleShare}
                                className='flex items-center gap-2'
                            >
                                <Link className='w-4 h-4' />
                                링크 복사
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* 전체 점수 카드 */}
            <Card className='border-0 shadow-lg mb-8'>
                <CardContent className='text-center pt-6'>
                    <div className='flex items-center justify-center mb-4'>
                        {getScoreIcon(analysisResult.overall_score)}
                        <div
                            className={`${displayOptions.compact ? 'text-4xl' : 'text-6xl'} font-bold ml-4`}
                            style={{ color: getScoreColor(analysisResult.overall_score) }}
                        >
                            {analysisResult.overall_score}점
                        </div>
                    </div>
                    <h2
                        className={`${displayOptions.compact ? 'text-xl' : 'text-2xl'} font-bold text-gray-800 mb-2`}
                    >
                        {getScoreLevel(analysisResult.overall_score)}
                    </h2>
                    <div className='max-w-md mx-auto'>
                        <Progress value={analysisResult.overall_score} className='h-3' />
                    </div>
                </CardContent>
            </Card>

            {/* 세부 점수 (내용/맥락/표현 = 30/30/40) */}
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8'>
                <Card className='border-0 shadow-lg text-center'>
                    <CardContent className='pt-6'>
                        <div className='text-sm text-muted-foreground mb-2'>내용</div>
                        <div className='flex items-center justify-center gap-2'>
                            <CheckCircle className='text-green-500 w-5 h-5' />
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(
                                        pctOf(analysisResult.detailed_scores?.content30, 30),
                                    ),
                                }}
                            >
                                {analysisResult.detailed_scores?.content30 ?? 0}
                            </div>
                            <span className='text-lg text-muted-foreground'>/ 30</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className='border-0 shadow-lg text-center'>
                    <CardContent className='pt-6'>
                        <div className='text-sm text-muted-foreground mb-2'>맥락</div>
                        <div className='flex items-center justify-center gap-2'>
                            <MessageCircle className='text-blue-500 w-5 h-5' />
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(
                                        pctOf(analysisResult.detailed_scores?.context30, 30),
                                    ),
                                }}
                            >
                                {analysisResult.detailed_scores?.context30 ?? 0}
                            </div>
                            <span className='text-lg text-muted-foreground'>/ 30</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className='border-0 shadow-lg text-center'>
                    <CardContent className='pt-6'>
                        <div className='text-sm text-muted-foreground mb-2'>표현</div>
                        <div className='flex items-center justify-center gap-2'>
                            <Trophy className='text-yellow-500 w-5 h-5' />
                            <div
                                className='text-3xl font-bold'
                                style={{
                                    color: getScoreColor(
                                        pctOf(analysisResult.detailed_scores?.expression40, 40),
                                    ),
                                }}
                            >
                                {analysisResult.detailed_scores?.expression40 ?? 0}
                            </div>
                            <span className='text-lg text-muted-foreground'>/ 40</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 표현 지수 (confidence/clarity/engagement/composure/professionalism/consistency) */}
            {analysisResult.expression_indices && (
                <Card className='border-0 shadow-lg mb-8'>
                    <CardHeader>
                        <CardTitle>표현 지수</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            <Card className='text-center'>
                                <CardContent className='pt-4'>
                                    <div className='text-gray-600 mb-1'>자신감</div>
                                    <div
                                        className='text-3xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                analysisResult.expression_indices.confidence,
                                            ),
                                        }}
                                    >
                                        {analysisResult.expression_indices.confidence}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className='text-center'>
                                <CardContent className='pt-4'>
                                    <div className='text-gray-600 mb-1'>명료성</div>
                                    <div
                                        className='text-3xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                analysisResult.expression_indices.clarity,
                                            ),
                                        }}
                                    >
                                        {analysisResult.expression_indices.clarity}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className='text-center'>
                                <CardContent className='pt-4'>
                                    <div className='text-gray-600 mb-1'>몰입도</div>
                                    <div
                                        className='text-3xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                analysisResult.expression_indices.engagement,
                                            ),
                                        }}
                                    >
                                        {analysisResult.expression_indices.engagement}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className='text-center'>
                                <CardContent className='pt-4'>
                                    <div className='text-gray-600 mb-1'>침착성</div>
                                    <div
                                        className='text-3xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                analysisResult.expression_indices.composure,
                                            ),
                                        }}
                                    >
                                        {analysisResult.expression_indices.composure}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className='text-center'>
                                <CardContent className='pt-4'>
                                    <div className='text-gray-600 mb-1'>전문성</div>
                                    <div
                                        className='text-3xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                analysisResult.expression_indices.professionalism,
                                            ),
                                        }}
                                    >
                                        {analysisResult.expression_indices.professionalism}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className='text-center'>
                                <CardContent className='pt-4'>
                                    <div className='text-gray-600 mb-1'>일관성</div>
                                    <div
                                        className='text-3xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                analysisResult.expression_indices.consistency,
                                            ),
                                        }}
                                    >
                                        {analysisResult.expression_indices.consistency}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        {typeof analysisResult.expression_indices.reliabilityWeight ===
                            'number' && (
                            <div className='mt-3 text-right text-xs text-gray-500'>
                                신뢰도 가중치: {analysisResult.expression_indices.reliabilityWeight}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 텍스트 분석 요약 (내용/맥락) */}
            {analysisResult.text_analysis_summary && (
                <Card className='border-0 shadow-lg mb-8'>
                    <CardHeader>
                        <CardTitle>텍스트 분석 요약(내용·맥락)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                            <Card>
                                <CardContent className='pt-4 text-center'>
                                    <div className='mb-2'>LLM 종합</div>
                                    <div
                                        className='text-4xl font-bold'
                                        style={{
                                            color: getScoreColor(
                                                (analysisResult.text_analysis_summary
                                                    .overall_llm10 || 0) * 10,
                                            ),
                                        }}
                                    >
                                        {analysisResult.text_analysis_summary.overall_llm10 || 0}
                                        <span className='text-base ml-1'>/ 10</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='pt-4'>
                                    <div className='mb-2'>내용 적합도</div>
                                    <Progress
                                        value={
                                            analysisResult.text_analysis_summary.content_avg100 || 0
                                        }
                                        className='h-3'
                                    />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='pt-4'>
                                    <div className='mb-2'>맥락 일치도</div>
                                    <Progress
                                        value={
                                            analysisResult.text_analysis_summary.context_avg100 || 0
                                        }
                                        className='h-3'
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        <Separator className='my-6' />

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <div className='mb-3 font-semibold'>상위 근거</div>
                                <div className='space-y-2'>
                                    {analysisResult.text_analysis_summary.top_reasons?.length ? (
                                        analysisResult.text_analysis_summary.top_reasons.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className='flex items-center gap-2'
                                                >
                                                    <CheckCircle className='text-green-500 w-4 h-4 flex-shrink-0' />
                                                    <span className='text-sm'>{item}</span>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className='text-sm text-muted-foreground'>
                                            근거 정보 없음
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className='mb-3 font-semibold'>개선 팁</div>
                                <div className='space-y-2'>
                                    {analysisResult.text_analysis_summary.top_improvements
                                        ?.length ? (
                                        analysisResult.text_analysis_summary.top_improvements.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className='flex items-center gap-2'
                                                >
                                                    <TrendingUp className='text-blue-500 w-4 h-4 flex-shrink-0' />
                                                    <span className='text-sm'>{item}</span>
                                                </div>
                                            ),
                                        )
                                    ) : (
                                        <div className='text-sm text-muted-foreground'>
                                            개선 팁 없음
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!!analysisResult.evidence_links?.length && (
                            <>
                                <Separator className='my-6' />
                                <div className='mb-3 font-semibold'>근거 하이라이트</div>
                                <div className='space-y-3'>
                                    {analysisResult.evidence_links.map((link, index) => (
                                        <div key={index} className='space-y-2'>
                                            <div className='flex items-center gap-2'>
                                                <Badge variant='secondary'>답변</Badge>
                                                <span className='text-sm'>{link.answer_span}</span>
                                            </div>
                                            {link.resume_ref && (
                                                <div className='flex items-center gap-2'>
                                                    <Badge variant='outline'>이력서</Badge>
                                                    <span className='text-sm'>
                                                        {link.resume_ref}
                                                    </span>
                                                </div>
                                            )}
                                            <div className='text-xs text-gray-500'>
                                                유사도: {fmt(link.similarity ?? '-', 3)}
                                                {link.explanation ? ` · ${link.explanation}` : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 문항별 텍스트 상세 */}
            {Array.isArray(perQuestionTextAnalyses) && perQuestionTextAnalyses.length > 0 && (
                <Card className='border-0 shadow-lg mb-8'>
                    <CardHeader>
                        <CardTitle>문항별 텍스트 상세</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-6'>
                            {perQuestionTextAnalyses.map((item, idx) => {
                                const qText = qaList?.[idx]?.question || `질문 ${idx + 1}`;
                                const content = item.content;
                                const context = item.context;
                                const contradiction = !!context?.consistency?.contradiction;
                                return (
                                    <Card key={item.questionId} className='border border-gray-100'>
                                        <CardContent className='pt-4'>
                                            <div className='mb-4 flex items-center justify-between'>
                                                <div className='font-semibold text-gray-800'>
                                                    {qText}
                                                </div>
                                                <div className='flex gap-2'>
                                                    {typeof content?.content_score === 'number' && (
                                                        <Badge
                                                            variant='secondary'
                                                            className='text-xs'
                                                            style={{
                                                                backgroundColor: getScoreColor(
                                                                    content.content_score,
                                                                ),
                                                                color: 'white',
                                                            }}
                                                        >
                                                            내용 {content.content_score}
                                                        </Badge>
                                                    )}
                                                    {typeof context?.context_score === 'number' && (
                                                        <Badge
                                                            variant='secondary'
                                                            className='text-xs'
                                                            style={{
                                                                backgroundColor: getScoreColor(
                                                                    context.context_score,
                                                                ),
                                                                color: 'white',
                                                            }}
                                                        >
                                                            맥락 {context.context_score}
                                                        </Badge>
                                                    )}
                                                    {contradiction && (
                                                        <Badge
                                                            variant='destructive'
                                                            className='text-xs flex items-center gap-1'
                                                        >
                                                            <AlertTriangle className='w-3 h-3' />
                                                            모순 감지
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                                <div>
                                                    <div className='mb-3 font-semibold'>근거</div>
                                                    <div className='space-y-2'>
                                                        {content?.reasoning?.length ? (
                                                            content.reasoning.map((r, index) => (
                                                                <div
                                                                    key={index}
                                                                    className='flex items-center gap-2'
                                                                >
                                                                    <CheckCircle className='text-green-500 w-4 h-4 flex-shrink-0' />
                                                                    <span className='text-sm'>
                                                                        {r}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className='text-sm text-muted-foreground'>
                                                                근거 없음
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!!content?.star && (
                                                        <div className='mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1'>
                                                            <div>
                                                                <strong>Situation:</strong>{' '}
                                                                {content.star.situation || '-'}
                                                            </div>
                                                            <div>
                                                                <strong>Task:</strong>{' '}
                                                                {content.star.task || '-'}
                                                            </div>
                                                            <div>
                                                                <strong>Action:</strong>{' '}
                                                                {content.star.action || '-'}
                                                            </div>
                                                            <div>
                                                                <strong>Result:</strong>{' '}
                                                                {content.star.result || '-'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className='mb-3 font-semibold'>
                                                        개선 팁
                                                    </div>
                                                    <div className='space-y-2'>
                                                        {content?.improvements?.length ? (
                                                            content.improvements.map(
                                                                (im, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className='flex items-center gap-2'
                                                                    >
                                                                        <TrendingUp className='text-blue-500 w-4 h-4 flex-shrink-0' />
                                                                        <span className='text-sm'>
                                                                            {im}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )
                                                        ) : (
                                                            <div className='text-sm text-muted-foreground'>
                                                                개선 팁 없음
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Separator className='my-4' />

                                                    <div className='mb-3 font-semibold'>
                                                        근거 링크
                                                    </div>
                                                    <div className='space-y-3'>
                                                        {context?.links?.length ? (
                                                            context.links.map((lnk, index) => (
                                                                <div
                                                                    key={index}
                                                                    className='space-y-2'
                                                                >
                                                                    <div className='flex items-center gap-2'>
                                                                        <Badge variant='secondary'>
                                                                            답변
                                                                        </Badge>
                                                                        <span className='text-sm'>
                                                                            {lnk.answer_span}
                                                                        </span>
                                                                    </div>
                                                                    {lnk.resume_ref && (
                                                                        <div className='flex items-center gap-2'>
                                                                            <Badge variant='outline'>
                                                                                이력서
                                                                            </Badge>
                                                                            <span className='text-sm'>
                                                                                {lnk.resume_ref}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className='text-xs text-gray-500'>
                                                                        유사도:{' '}
                                                                        {fmt(
                                                                            lnk.similarity ?? '-',
                                                                            3,
                                                                        )}
                                                                        {lnk.explanation
                                                                            ? ` · ${lnk.explanation}`
                                                                            : ''}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className='text-sm text-muted-foreground'>
                                                                링크 없음
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 음성/영상 분석 요약 카드 */}
            {(audioData?.overall || visualData?.overall) && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                    {audioData?.overall && displayOptions.showAudioAnalysis && (
                        <Card className='border-0 shadow-lg'>
                            <CardContent className='p-6'>
                                <div className='flex items-start gap-4'>
                                    <div className='text-4xl text-blue-500'>
                                        <Volume2 />
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
                                                size='sm'
                                                onClick={() =>
                                                    setShowAudioDetails(!showAudioDetails)
                                                }
                                            >
                                                {showAudioDetails ? '지표 닫기' : '지표 확인하기'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {visualData?.overall && displayOptions.showVisualAnalysis && (
                        <Card className='border-0 shadow-lg'>
                            <CardContent className='p-6'>
                                <div className='flex items-start gap-4'>
                                    <div className='text-4xl text-blue-500'>
                                        <Smile />
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
                                                size='sm'
                                                onClick={() =>
                                                    setShowVisualDetails(!showVisualDetails)
                                                }
                                            >
                                                {showVisualDetails ? '지표 닫기' : '지표 확인하기'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* 질문별 비주얼 비교 (캘리브레이션) */}
            {displayOptions.showVisualAnalysis &&
                calibrationCompare?.visual?.normalizedPerQuestion &&
                visualData?.perQuestion && (
                    <Card className='border-0 shadow-lg mb-8'>
                        <CardHeader>
                            <CardTitle>질문별 비주얼 비교</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-6'>
                                {Object.keys(visualData.perQuestion).map((qid, idx) => {
                                    const raw = (visualData.perQuestion as any)[qid] || {};
                                    const norm =
                                        calibrationCompare?.visual?.normalizedPerQuestion?.[qid];
                                    const svr =
                                        calibrationCompare?.visual?.serverQuestionScores?.[qid];
                                    return (
                                        <div key={qid} className='w-full'>
                                            <div className='flex justify-between items-start mb-3'>
                                                <div className='font-semibold'>
                                                    Q{idx + 1} ({qid})
                                                </div>
                                                {svr?.score != null && (
                                                    <Badge
                                                        variant='secondary'
                                                        className='text-xs'
                                                        style={{
                                                            backgroundColor: getScoreColor(
                                                                svr.score,
                                                            ),
                                                            color: 'white',
                                                        }}
                                                    >
                                                        정규화 {svr.score.toFixed(0)}
                                                        {svr.calibrationApplied ? ' ✓' : ''}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                                <Card>
                                                    <CardContent className='pt-3'>
                                                        <div className='text-gray-500 text-sm mb-2'>
                                                            Raw
                                                        </div>
                                                        <div className='text-sm'>
                                                            confidence_mean:{' '}
                                                            {fmt(raw?.confidence_mean)}
                                                        </div>
                                                        <div className='text-sm'>
                                                            smile_mean: {fmt(raw?.smile_mean)}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className='pt-3'>
                                                        <div className='text-gray-500 text-sm mb-2'>
                                                            Calibrated
                                                        </div>
                                                        <div className='text-sm'>
                                                            confidence_mean:{' '}
                                                            {fmt(norm?.confidence_mean)}
                                                        </div>
                                                        <div className='text-sm'>
                                                            smile_mean: {fmt(norm?.smile_mean)}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className='pt-3'>
                                                        <div className='text-gray-500 text-sm mb-2'>
                                                            Presence/Level
                                                        </div>
                                                        <div className='text-xs text-gray-600'>
                                                            good/avg/need:{' '}
                                                            {raw?.presence_dist
                                                                ? `${raw.presence_dist.good}/${raw.presence_dist.average}/${raw.presence_dist.needs_improvement}`
                                                                : '-'}
                                                        </div>
                                                        <div className='text-xs text-gray-600'>
                                                            warn/crit:{' '}
                                                            {raw?.level_dist
                                                                ? `${raw.level_dist.warning}/${raw.level_dist.critical}`
                                                                : '-'}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

            {/* 상세 음성 지표 */}
            {audioData?.overall && showAudioDetails && displayOptions.showAudioAnalysis && (
                <Card className='border-0 shadow-lg mb-8'>
                    <CardHeader>
                        <CardTitle>종합 음성 지표</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <Card>
                                <CardContent className='pt-4'>
                                    <div className='text-center mb-4'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            톤 안정성
                                        </div>
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
                                    <div className='space-y-2'>
                                        <div className='flex justify-between text-sm'>
                                            <span>평균 f0_mean (Hz)</span>
                                            <span>
                                                {audioData.overall.f0_mean?.toFixed(1) || '-'}
                                            </span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span>평균 f0_std (Hz)</span>
                                            <span>
                                                {audioData.overall.f0_std?.toFixed(2) || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='pt-4'>
                                    <div className='text-center mb-4'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            목소리 떨림
                                        </div>
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
                                    <div className='space-y-2'>
                                        <div className='flex justify-between text-sm'>
                                            <span>평균 jitter_like</span>
                                            <span>
                                                {audioData.overall.jitter_like?.toFixed(3) || '-'}
                                            </span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span>평균 shimmer_like</span>
                                            <span>
                                                {audioData.overall.shimmer_like?.toFixed(3) || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='pt-4'>
                                    <div className='text-center mb-4'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            말 빠르기
                                        </div>
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
                                    <div className='space-y-2'>
                                        <div className='flex justify-between text-sm'>
                                            <span>평균 침묵 비율</span>
                                            <span>
                                                {audioData.overall.silence_ratio
                                                    ? `${(audioData.overall.silence_ratio * 100).toFixed(1)}%`
                                                    : '-'}
                                            </span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span>평균 rms_cv</span>
                                            <span>
                                                {audioData.overall.rms_cv?.toFixed(3) || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 상세 영상 지표 */}
            {visualData?.overall && showVisualDetails && displayOptions.showVisualAnalysis && (
                <Card className='border-0 shadow-lg mb-8'>
                    <CardHeader>
                        <CardTitle>종합 영상 지표</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <Card>
                                <CardContent className='pt-4'>
                                    <div className='text-center mb-4'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            자신감 점수
                                        </div>
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
                                    <div className='space-y-2'>
                                        <div className='flex justify-between text-sm'>
                                            <span>평균 자신감</span>
                                            <span>
                                                {visualData.overall.confidence_mean
                                                    ? (
                                                          visualData.overall.confidence_mean * 100
                                                      ).toFixed(0)
                                                    : '-'}
                                            </span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span>샘플 수</span>
                                            <span>{visualData.overall.count || 0}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='pt-4'>
                                    <div className='text-center mb-4'>
                                        <div className='text-base text-gray-600 mb-2'>
                                            행동 점수
                                        </div>
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
                                    <div className='space-y-2'>
                                        <div className='flex justify-between text-sm'>
                                            <span>미소 평균</span>
                                            <span>
                                                {visualData.overall.smile_mean
                                                    ? (visualData.overall.smile_mean * 100).toFixed(
                                                          0,
                                                      )
                                                    : '-'}
                                            </span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span>presence good</span>
                                            <span>
                                                {pct(
                                                    visualData.overall.presence_dist?.good,
                                                    visualData.overall.count,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className='pt-4'>
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
                                    <div className='space-y-2'>
                                        <div className='flex justify-between text-sm'>
                                            <span>경고 (warn)</span>
                                            <span>
                                                {visualData.overall.level_dist?.warning || 0}
                                            </span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span>치명 (critical)</span>
                                            <span>
                                                {visualData.overall.level_dist?.critical || 0}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 질문별 음성 분석 (간략) */}
            {audioData?.perQuestion &&
                audioData.perQuestion.length > 0 &&
                displayOptions.showAudioAnalysis && (
                    <Card className='border-0 shadow-lg mb-8'>
                        <CardHeader>
                            <CardTitle>질문별 음성 분석</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-6'>
                                {audioData.perQuestion.map((item, index) => (
                                    <div key={index} className='w-full'>
                                        <div className='flex justify-between items-start mb-3'>
                                            <div className='font-semibold text-lg'>
                                                Q{item.questionNumber}. {item.question}
                                            </div>
                                            <div className='flex gap-2 flex-wrap'>
                                                {typeof item.tone_score === 'number' && (
                                                    <Badge
                                                        variant='secondary'
                                                        className='text-xs flex items-center gap-1'
                                                        style={{
                                                            backgroundColor: getScoreColor(
                                                                item.tone_score,
                                                            ),
                                                            color: 'white',
                                                        }}
                                                    >
                                                        <Volume2 className='w-3 h-3' /> 톤{' '}
                                                        {item.tone_score}
                                                    </Badge>
                                                )}
                                                {typeof item.vibrato_score === 'number' && (
                                                    <Badge
                                                        variant='secondary'
                                                        className='text-xs flex items-center gap-1'
                                                        style={{
                                                            backgroundColor: getScoreColor(
                                                                item.vibrato_score,
                                                            ),
                                                            color: 'white',
                                                        }}
                                                    >
                                                        <Mic className='w-3 h-3' /> 떨림{' '}
                                                        {item.vibrato_score}
                                                    </Badge>
                                                )}
                                                {typeof item.pace_score === 'number' && (
                                                    <Badge
                                                        variant='secondary'
                                                        className='text-xs flex items-center gap-1'
                                                        style={{
                                                            backgroundColor: getScoreColor(
                                                                item.pace_score,
                                                            ),
                                                            color: 'white',
                                                        }}
                                                    >
                                                        <Clock className='w-3 h-3' /> 속도{' '}
                                                        {item.pace_score}
                                                    </Badge>
                                                )}
                                                {typeof (item as any).normalized_score ===
                                                    'number' && (
                                                    <Badge
                                                        variant='secondary'
                                                        className='text-xs flex items-center gap-1'
                                                        style={{
                                                            backgroundColor: getScoreColor(
                                                                (item as any)
                                                                    .normalized_score as number,
                                                            ),
                                                            color: 'white',
                                                        }}
                                                    >
                                                        <Zap className='w-3 h-3' /> 정규화{' '}
                                                        {(
                                                            (item as any).normalized_score as number
                                                        ).toFixed(2)}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {item.audioUrl && (
                                            <audio
                                                controls
                                                src={item.audioUrl}
                                                className='w-full mb-3'
                                            />
                                        )}
                                        {calibrationCompare?.audio?.ratiosPerQuestion &&
                                            (() => {
                                                const key = String(item.questionNumber);
                                                const ratios =
                                                    calibrationCompare?.audio?.ratiosPerQuestion?.[
                                                        key
                                                    ];
                                                if (!ratios) return null;
                                                return (
                                                    <div className='mt-2 text-xs text-gray-600'>
                                                        <span className='mr-2'>정규화 비율:</span>
                                                        <div className='flex gap-2 flex-wrap'>
                                                            {'f0_mean' in ratios && (
                                                                <Badge variant='outline'>
                                                                    f0 {fmt(ratios.f0_mean)}
                                                                </Badge>
                                                            )}
                                                            {'f0_std' in ratios && (
                                                                <Badge variant='outline'>
                                                                    f0σ {fmt(ratios.f0_std)}
                                                                </Badge>
                                                            )}
                                                            {'rms_cv' in ratios && (
                                                                <Badge variant='outline'>
                                                                    rms_cv {fmt(ratios.rms_cv)}
                                                                </Badge>
                                                            )}
                                                            {'jitter_like' in ratios && (
                                                                <Badge variant='outline'>
                                                                    jitter {fmt(ratios.jitter_like)}
                                                                </Badge>
                                                            )}
                                                            {'shimmer_like' in ratios && (
                                                                <Badge variant='outline'>
                                                                    shimmer{' '}
                                                                    {fmt(ratios.shimmer_like)}
                                                                </Badge>
                                                            )}
                                                            {'silence_ratio' in ratios && (
                                                                <Badge variant='outline'>
                                                                    silence{' '}
                                                                    {fmt(ratios.silence_ratio)}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

            {/* 종합 평가 */}
            <Card className='border-0 shadow-lg mb-8'>
                <CardHeader>
                    <CardTitle>종합 평가</CardTitle>
                </CardHeader>
                <CardContent>
                    <p
                        className={`${displayOptions.compact ? 'text-base' : 'text-lg'} leading-relaxed text-gray-800`}
                    >
                        {analysisResult.overall_evaluation}
                    </p>
                </CardContent>
            </Card>

            {/* 강점과 개선사항 */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                <Card className='border-0 shadow-lg'>
                    <CardHeader>
                        <CardTitle>강점</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-3'>
                            {analysisResult.strengths?.length ? (
                                analysisResult.strengths.map((item, index) => (
                                    <div key={index} className='flex items-start gap-2'>
                                        <CheckCircle className='text-green-500 w-5 h-5 mt-0.5 flex-shrink-0' />
                                        <span className='text-sm'>{item}</span>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-muted-foreground'>강점 정보 없음</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className='border-0 shadow-lg'>
                    <CardHeader>
                        <CardTitle>개선사항</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-3'>
                            {analysisResult.improvements?.length ? (
                                analysisResult.improvements.map((item, index) => (
                                    <div key={index} className='flex items-start gap-2'>
                                        <TrendingUp className='text-orange-500 w-5 h-5 mt-0.5 flex-shrink-0' />
                                        <span className='text-sm'>{item}</span>
                                    </div>
                                ))
                            ) : (
                                <div className='text-sm text-muted-foreground'>
                                    개선사항 정보 없음
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 질문별 상세 피드백 */}
            {displayOptions.showDetailedFeedback && (
                <Card className='border-0 shadow-lg mb-8'>
                    <CardHeader>
                        <div className='flex justify-between items-center'>
                            <CardTitle>질문별 상세 피드백</CardTitle>
                            {displayOptions.compact && (
                                <Button
                                    size='sm'
                                    onClick={() => setShowFullFeedback(!showFullFeedback)}
                                >
                                    {showFullFeedback ? '접기' : '펼치기'}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    {(!displayOptions.compact || showFullFeedback) && (
                        <CardContent>
                            <div className='space-y-6'>
                                {qaList.length > 0
                                    ? qaList.map((qa, index) => {
                                          const questionKey = `question_${index + 1}`;
                                          const feedback =
                                              analysisResult.detailed_feedback?.[questionKey];

                                          return (
                                              <div key={index} className='w-full'>
                                                  <div className='flex justify-between items-start mb-3'>
                                                      <div className='font-semibold text-lg'>
                                                          Q{index + 1}. {qa.question}
                                                      </div>
                                                      {feedback && (
                                                          <Badge
                                                              variant='secondary'
                                                              className='text-sm'
                                                              style={{
                                                                  backgroundColor: getScoreColor(
                                                                      feedback.score * 10,
                                                                  ),
                                                                  color: 'white',
                                                              }}
                                                          >
                                                              {feedback.score}/10점
                                                          </Badge>
                                                      )}
                                                  </div>
                                                  <div className='bg-gray-50 p-4 rounded-lg mb-3'>
                                                      <p className='text-sm text-gray-600'>
                                                          <strong>답변:</strong> {qa.answer}
                                                      </p>
                                                  </div>
                                                  {feedback && (
                                                      <div className='bg-blue-50 p-4 rounded-lg'>
                                                          <p className='text-sm'>
                                                              <strong>AI 피드백:</strong>{' '}
                                                              {feedback.feedback}
                                                          </p>
                                                      </div>
                                                  )}
                                              </div>
                                          );
                                      })
                                    : Object.keys(analysisResult.detailed_feedback || {}).map(
                                          (questionKey, index) => {
                                              const feedback =
                                                  analysisResult.detailed_feedback?.[questionKey];
                                              const question =
                                                  feedback?.question || `질문 ${index + 1}`;

                                              return (
                                                  <div key={questionKey} className='w-full'>
                                                      <div className='flex justify-between items-start mb-3'>
                                                          <div className='font-semibold text-lg'>
                                                              Q{index + 1}. {question}
                                                          </div>
                                                          {feedback && (
                                                              <Badge
                                                                  variant='secondary'
                                                                  className='text-sm'
                                                                  style={{
                                                                      backgroundColor:
                                                                          getScoreColor(
                                                                              feedback.score * 10,
                                                                          ),
                                                                      color: 'white',
                                                                  }}
                                                              >
                                                                  {feedback.score}/10점
                                                              </Badge>
                                                          )}
                                                      </div>
                                                      {feedback && (
                                                          <div className='bg-blue-50 p-4 rounded-lg'>
                                                              <p className='text-sm'>
                                                                  <strong>AI 피드백:</strong>{' '}
                                                                  {feedback.feedback}
                                                              </p>
                                                          </div>
                                                      )}
                                                  </div>
                                              );
                                          },
                                      )}
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* 1분 자기소개 대본 */}
            <Card className='border-0 shadow-lg mb-8'>
                <CardHeader>
                    <CardTitle>1분 자기소개 대본</CardTitle>
                </CardHeader>
                <CardContent>
                    {analysisResult.self_intro_script ? (
                        <div className='whitespace-pre-line text-gray-800 leading-relaxed'>
                            {analysisResult.self_intro_script}
                        </div>
                    ) : (
                        <Alert>
                            <AlertTriangle className='h-4 w-4' />
                            <AlertDescription>
                                <div className='font-semibold mb-1'>대본 준비 중</div>
                                <div>
                                    이력서 요약을 바탕으로 대본을 생성하고 있습니다. 잠시 후
                                    새로고침해보세요.
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* 인쇄용 스타일 */}
            <style jsx>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                    .shadow-lg {
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb !important;
                    }
                }
                .interview-report.compact .shadow-lg {
                    margin-bottom: 16px;
                }
            `}</style>
        </div>
    );
}
