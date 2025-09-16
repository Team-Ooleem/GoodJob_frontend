'use client';

import { useEffect, useState } from 'react';
import {
    Card,
    List,
    Typography,
    Tag,
    Space,
    Button,
    Pagination,
    Empty,
    Spin,
    message,
    Modal,
} from 'antd';
import { TrophyOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '@/apis/api';
import { useRouter } from 'next/navigation';
import InterviewReport from '../_components/InterviewReport';
import type { InterviewAnalysisResult } from '@/types/report';

type ReportListItem = {
    session_id: string;
    overall_score: number;
    question_count: number;
    created_at: string;
};

// Report type is imported from shared types

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

const { Title, Text } = Typography;

export default function ReportsPage() {
    const [items, setItems] = useState<ReportListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState<number | undefined>(undefined);

    // 모달 관련 상태
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<InterviewAnalysisResult | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [selectedAudioData, setSelectedAudioData] = useState<AudioAnalysisData | null>(null);
    const [selectedVisualData, setSelectedVisualData] = useState<VisualAnalysisData | null>(null);
    const [selectedVisualQuestionScores, setSelectedVisualQuestionScores] = useState<Record<string, { score: number; calibrationApplied?: boolean }> | null>(null);
    const [selectedPerQuestionTextAnalyses, setSelectedPerQuestionTextAnalyses] = useState<PerQuestionTextAnalysis[] | null>(null);

    const router = useRouter();

    const fetchList = async (p = page, ps = pageSize) => {
        setLoading(true);
        try {
            const offset = (p - 1) * ps;
            const res = await api.get('/report', { params: { limit: ps, offset } });
            if (res.data?.success) {
                const rows = (res.data.data || []) as ReportListItem[];
                setItems(rows);
                setTotal(rows.length < ps ? offset + rows.length : undefined);
            }
        } catch (e) {
            message.error('리포트 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(page, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    const scoreTag = (score: number) => {
        const color = score >= 90 ? 'green' : score >= 80 ? 'blue' : score >= 70 ? 'orange' : 'red';
        return <Tag color={color}>{score}점</Tag>;
    };

    // 음성/영상 지표 로드 함수
    const loadMetricsData = async (sessionId: string) => {
        try {
            // 음성 지표 로드
            let audioData: AudioAnalysisData | null = null;
            try {
                const audioRes = await api.get(`/audio-metrics/${sessionId}/overall`);
                if (audioRes.data?.ok && audioRes.data?.overall) {
                    const audioOverall = audioRes.data.overall;

                    // 문항별 음성 지표도 로드
                    let audioPerQuestion = [] as any[];
                    try {
                        const audioPerQRes = await api.get(`/audio-metrics/${sessionId}`);
                        if (audioPerQRes.data?.ok && audioPerQRes.data?.rows) {
                            audioPerQuestion = (audioPerQRes.data.rows as any[])
                                .filter((r) => Number.isFinite(Number((r as any)?.question_id)) && Number((r as any)?.question_id) > 0)
                                .map((r) => ({ ...(r as any), questionNumber: Number((r as any).question_id) }));
                        }
                    } catch (e) {
                        console.warn('문항별 음성 지표 로드 실패:', e);
                    }

                    audioData = {
                        overall: audioOverall,
                        perQuestion: audioPerQuestion,
                    };
                    console.log('서버 음성 지표 로드 성공:', audioData);
                }
            } catch (e) {
                console.warn('음성 지표 로드 실패:', e);
            }

            // 영상 지표 로드
            let visualData: VisualAnalysisData | null = null;
            try {
                const visualRes = await api.post(`/metrics/${sessionId}/finalize`, {});
                if (visualRes.data?.ok && visualRes.data?.aggregate) {
                    visualData = {
                        overall: visualRes.data.aggregate.overall,
                        perQuestion: (() => {
                            const src = visualRes.data.aggregate.perQuestion || {};
                            const out: Record<string, any> = {};
                            for (const [k, v] of Object.entries(src)) {
                                const n = Number(k);
                                if (Number.isFinite(n) && n > 0) out[String(n)] = v;
                            }
                            return out;
                        })(),
                    };
                    console.log('영상 지표 로드 성공:', visualData);
                }
            } catch (e) {
                console.warn('영상 지표 로드 실패:', e);
            }

            return { audioData, visualData };
        } catch (error) {
            console.error('지표 데이터 로드 실패:', error);
            return { audioData: null, visualData: null };
        }
    };

    // 모달에서 리포트 상세 보기
    const viewReportInModal = async (sessionId: string) => {
        try {
            setModalLoading(true);
            setSelectedSessionId(sessionId);
            setSelectedReport(null);
            setSelectedAudioData(null);
            setSelectedVisualData(null);
            setSelectedPerQuestionTextAnalyses(null);
            setModalVisible(true);

            // 리포트 데이터 로드
            const response = await api.get(`/report/${sessionId}`);
            if (response.data?.success) {
                const report = response.data.data;
                setSelectedReport(report);
                // audio_summary를 먼저 audioData에 반영
                try {
                    const s = report?.audio_summary;
                    if (s) {
                        const audioOverall: any = {
                            tone_score: Number(s.toneScore) || undefined,
                            vibrato_score: Number(s.vibratoScore) || undefined,
                            pace_score: Number(s.paceScore) || undefined,
                            overall_voice_score: Number(s.overallScore10) * 10 || undefined,
                            ...(s.averages || {}),
                        };
                        const perQ = Array.isArray(s.questionScores)
                            ? (s.questionScores as Array<any>).map((q: any, idx: number) => {
                                  const qNum = Number(q?.questionId);
                                  const questionNumber = Number.isFinite(qNum) && qNum > 0 ? qNum : idx + 1;
                                  return {
                                      questionNumber,
                                      question: `질문 ${questionNumber}`,
                                      normalized_score: typeof q.score === 'number' ? q.score : undefined,
                                      calibrationApplied: !!q.calibrationApplied,
                                  };
                              })
                            : [];
                        setSelectedAudioData({ overall: audioOverall, perQuestion: perQ });
                    }
                } catch {}
                // visual_summary 반영(자신감/행동 점수 제공 + 질문별 점수)
                try {
                    const vs = report?.visual_summary;
                    if (vs) {
                        const overall: any = { ...(vs.overall || {}) };
                        if (typeof vs.confidenceScore === 'number')
                            overall.confidence_score = vs.confidenceScore;
                        if (typeof vs.behaviorScore === 'number')
                            overall.behavior_score = vs.behaviorScore;
                        setSelectedVisualData((prev) => ({
                            overall: { ...(prev?.overall || {}), ...overall },
                            perQuestion: prev?.perQuestion || undefined,
                        }));
                        if (Array.isArray(vs.questionScores)) {
                            const map: Record<string, { score: number; calibrationApplied?: boolean }> = {};
                            for (const q of vs.questionScores) {
                                if (q?.questionId) map[q.questionId] = { score: Math.round(Number(q.score) || 0), calibrationApplied: !!q.calibrationApplied };
                            }
                            setSelectedVisualQuestionScores(map);
                        }
                    }
                } catch {}
                // 문항별 텍스트 분석 묶음 조회
                try {
                    const faRes = await api.post(`/ai/${sessionId}/finalize-analyses`, {});
                    const list = faRes?.data?.analyses as Array<PerQuestionTextAnalysis>;
                    if (Array.isArray(list)) setSelectedPerQuestionTextAnalyses(list);
                } catch (e) {
                    console.warn('문항별 텍스트 분석 조회 실패(모달):', e);
                }
            } else {
                throw new Error('리포트 로드 실패');
            }

            // 음성/영상 지표 데이터 로드
            const { audioData, visualData } = await loadMetricsData(sessionId);
            // audio_summary가 먼저 세팅돼 있을 수 있으므로 병합
            setSelectedAudioData((prev) => {
                if (!prev) return audioData;
                if (!audioData) return prev;
                const mergedOverall = { ...(audioData.overall || {}), ...(prev.overall || {}) } as any;
                const prevArr = Array.isArray(prev.perQuestion) ? prev.perQuestion : [];
                const nextArr = Array.isArray(audioData.perQuestion) ? audioData.perQuestion : [];
                const map = new Map<number, any>();
                for (const it of nextArr) map.set(Number((it as any).questionNumber) || map.size + 1, { ...it });
                for (const it of prevArr) {
                    const key = Number((it as any).questionNumber) || map.size + 1;
                    map.set(key, { ...(map.get(key) || {}), ...it });
                }
                const mergedPerQ = Array.from(map.entries()).sort((a,b)=>a[0]-b[0]).map(([_,v])=>v);
                return { overall: mergedOverall, perQuestion: mergedPerQ } as any;
            });
            setSelectedVisualData(visualData);
        } catch (error) {
            console.error('리포트 상세 로드 실패:', error);
            message.error('리포트를 불러오는데 실패했습니다.');
            setSelectedReport(null);
            setSelectedAudioData(null);
            setSelectedVisualData(null);
        } finally {
            setModalLoading(false);
        }
    };

    // 별도 페이지에서 리포트 보기
    const viewReportInPage = (sessionId: string) => {
        router.push(`/ai-interview/result?sessionId=${sessionId}`);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedReport(null);
        setSelectedSessionId(null);
        setSelectedAudioData(null);
        setSelectedVisualData(null);
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
            <div className='container mx-auto px-4'>
                <div className='text-center mb-6'>
                    <Title level={2} className='!text-3xl !font-bold !text-gray-800'>
                        <TrophyOutlined className='mr-2 text-yellow-500' /> AI 면접 리포트 목록
                    </Title>
                    <Text type='secondary'>최근 진행한 모의면접 리포트를 확인하세요.</Text>
                </div>

                <Card className='!border-0 !shadow-lg'>
                    <div className='flex justify-between items-center mb-3'>
                        <div />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => fetchList()}
                            disabled={loading}
                        >
                            새로고침
                        </Button>
                    </div>

                    {loading ? (
                        <div className='py-16 text-center'>
                            <Spin size='large' />
                        </div>
                    ) : items.length === 0 ? (
                        <Empty description='리포트가 없습니다' />
                    ) : (
                        <>
                            <List
                                dataSource={items}
                                renderItem={(it) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key='modal'
                                                type='primary'
                                                icon={<FileSearchOutlined />}
                                                onClick={() => viewReportInModal(it.session_id)}
                                            >
                                                빠른 보기
                                            </Button>,
                                            <Button
                                                key='page'
                                                onClick={() => viewReportInPage(it.session_id)}
                                            >
                                                상세 페이지
                                            </Button>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={
                                                <Space size='large'>
                                                    <Text strong>
                                                        세션ID: {it.session_id.slice(-8)}
                                                    </Text>
                                                    {scoreTag(it.overall_score)}
                                                </Space>
                                            }
                                            description={
                                                <Space size='large'>
                                                    <Text type='secondary'>
                                                        문항 수: {it.question_count}
                                                    </Text>
                                                    <Text type='secondary'>
                                                        생성일:{' '}
                                                        {new Date(it.created_at).toLocaleString()}
                                                    </Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                            <div className='mt-4 flex justify-center'>
                                <Pagination
                                    current={page}
                                    pageSize={pageSize}
                                    total={total}
                                    showSizeChanger
                                    onChange={(p, ps) => {
                                        setPage(p);
                                        setPageSize(ps);
                                    }}
                                />
                            </div>
                        </>
                    )}
                </Card>
            </div>

            {/* 리포트 상세 보기 모달 */}
            <Modal
                title='면접 결과 상세'
                open={modalVisible}
                onCancel={closeModal}
                footer={null}
                width='90%'
                style={{ maxWidth: 1200 }}
            >
                {modalLoading ? (
                    <div className='text-center py-8'>
                        <Spin size='large' />
                        <div className='mt-4'>상세 결과를 불러오는 중...</div>
                    </div>
                ) : selectedReport ? (
                    <InterviewReport
                        analysisResult={selectedReport}
                        audioData={selectedAudioData || undefined}
                        visualData={selectedVisualData || undefined}
                        perQuestionTextAnalyses={selectedPerQuestionTextAnalyses || undefined}
                        sessionMeta={{
                            sessionId: selectedSessionId || 'unknown',
                        }}
                        displayOptions={{
                            showHeader: false,
                            showActions: false,
                            showDetailedFeedback: true,
                            showAudioAnalysis: true,
                            showVisualAnalysis: true,
                            compact: true,
                        }}
                        viewMode={'compare'}
                        calibrationCompare={{
                            visual: {
                                serverQuestionScores:
                                    selectedVisualQuestionScores || undefined,
                            },
                            audio: {},
                        }}
                    />
                ) : (
                    <Empty description='리포트를 불러올 수 없습니다.' />
                )}
            </Modal>
        </div>
    );
}
