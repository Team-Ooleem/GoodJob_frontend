// result/page.tsx - 컴포넌트 기반 단순화 버전
'use client';

import { useState, useEffect } from 'react';
import { Card, Alert, Button, Spin, Space } from 'antd';
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

export default function AiInterviewResultPage() {
    const [analysisResult, setAnalysisResult] = useState<InterviewAnalysisResult | null>(null);
    const [qaList, setQaList] = useState<QAPair[]>([]);
    const [audioData, setAudioData] = useState<AudioAnalysisData | null>(null);
    const [visualData, setVisualData] = useState<VisualAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dataSource, setDataSource] = useState<DataSource>('server');
    const [sessionId, setSessionId] = useState<string | null>(null);

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
                    setAnalysisResult(response.data.data);
                    setDataSource('server');
                    console.log('✅ 서버에서 리포트 로드 성공');
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
                        let audioPerQuestion = [];
                        try {
                            const audioPerQRes = await api.get(`/audio-metrics/${urlSessionId}`);
                            if (audioPerQRes.data?.ok && audioPerQRes.data?.rows) {
                                audioPerQuestion = audioPerQRes.data.rows;
                            }
                        } catch (e) {
                            console.warn('문항별 음성 지표 로드 실패:', e);
                        }

                        setAudioData({
                            overall: audioOverall,
                            perQuestion: audioPerQuestion,
                        });
                        console.log('✅ 서버에서 음성 지표 로드 성공');
                    }
                } catch (e) {
                    console.warn('서버 음성 지표 로드 실패:', e);
                }

                try {
                    // 영상 지표 로드
                    const visualRes = await api.post(`/metrics/${urlSessionId}/finalize`, {});
                    if (visualRes.data?.ok && visualRes.data?.aggregate) {
                        setVisualData({
                            overall: visualRes.data.aggregate.overall,
                            perQuestion: visualRes.data.aggregate.perQuestion,
                        });
                        console.log('✅ 서버에서 영상 지표 로드 성공');
                    }
                } catch (e) {
                    console.warn('서버 영상 지표 로드 실패:', e);
                }
            } else {
                // localStorage에서 로드 (기존 로직)
                try {
                    // 서버 음성 지표 시도
                    const serverAudioOverall = localStorage.getItem('interviewAudioOverallServer');
                    const serverAudioPerQuestion = localStorage.getItem(
                        'interviewAudioPerQuestionServer',
                    );

                    if (serverAudioOverall) {
                        const audioOverall = JSON.parse(serverAudioOverall);
                        let audioPerQuestion = [];

                        if (serverAudioPerQuestion) {
                            audioPerQuestion = JSON.parse(serverAudioPerQuestion);
                        }

                        setAudioData({
                            overall: audioOverall,
                            perQuestion: audioPerQuestion,
                        });
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

                            setAudioData({
                                overall: {
                                    ...audioOverall,
                                    // 클라이언트 데이터에 점수 추가 (기본값)
                                    tone_score: 75,
                                    vibrato_score: 75,
                                    pace_score: 75,
                                    overall_voice_score: 75,
                                },
                                perQuestion: audioPerQuestion,
                            });
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
                        setVisualData({
                            overall: JSON.parse(visualOverall),
                            perQuestion: visualPerQuestion ? JSON.parse(visualPerQuestion) : {},
                        });
                        console.log('✅ localStorage 영상 지표 로드 성공');
                    }
                } catch (e) {
                    console.warn('localStorage 영상 지표 로드 실패:', e);
                }
            }
        } catch (err: any) {
            console.error('리포트 로드 완전 실패:', err);
            setError(err.message || '면접 결과를 불러오는 중 오류가 발생했습니다.');
            setDataSource('unavailable');
        } finally {
            setLoading(false);
        }
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

                {/* 리포트 컴포넌트 */}
                <InterviewReport
                    analysisResult={analysisResult}
                    qaList={qaList}
                    audioData={audioData || undefined}
                    visualData={visualData || undefined}
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
