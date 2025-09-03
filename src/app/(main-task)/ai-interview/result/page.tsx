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

export default function AiInterviewResultPage() {
    const [analysisResult, setAnalysisResult] = useState<InterviewAnalysisResult | null>(null);
    const [analysisError, setAnalysisError] = useState<InterviewAnalysisError | null>(null);
    const [qaList, setQaList] = useState<QAPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // localStorage에서 데이터 가져오기
        try {
            const storedAnalysis = localStorage.getItem('interviewAnalysis');
            const storedQA = localStorage.getItem('interviewQA');

            if (storedAnalysis && storedQA) {
                const analysis = JSON.parse(storedAnalysis);
                const qa = JSON.parse(storedQA);

                // API 실패 여부 확인
                if (analysis.error) {
                    setAnalysisError(analysis);
                } else {
                    setAnalysisResult(analysis);
                }

                setQaList(qa);
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
