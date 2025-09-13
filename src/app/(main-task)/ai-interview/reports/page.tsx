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

type ReportListItem = {
    session_id: string;
    overall_score: number;
    question_count: number;
    created_at: string;
};

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
                    let audioPerQuestion = [];
                    try {
                        const audioPerQRes = await api.get(`/audio-metrics/${sessionId}`);
                        if (audioPerQRes.data?.ok && audioPerQRes.data?.rows) {
                            audioPerQuestion = audioPerQRes.data.rows;
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
                        perQuestion: visualRes.data.aggregate.perQuestion,
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
            setModalVisible(true);

            // 리포트 데이터 로드
            const response = await api.get(`/report/${sessionId}`);
            if (response.data?.success) {
                setSelectedReport(response.data.data);
            } else {
                throw new Error('리포트 로드 실패');
            }

            // 음성/영상 지표 데이터 로드
            const { audioData, visualData } = await loadMetricsData(sessionId);
            setSelectedAudioData(audioData);
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
                    />
                ) : (
                    <Empty description='리포트를 불러올 수 없습니다.' />
                )}
            </Modal>
        </div>
    );
}
