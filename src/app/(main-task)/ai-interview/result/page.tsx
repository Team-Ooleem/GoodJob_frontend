// result/page.tsx - 간소화된 메인 페이지
'use client';

import { Card, Alert, Button, Spin, Space } from 'antd';
import Link from 'next/link';
import InterviewReport from '../_components/InterviewReport';
import { useInterviewResult } from './_hooks/useInterviewResult';
import { CalibrationComparison, DataSourceAlert, ActionButtons } from './_components';

export default function AiInterviewResultPage() {
    const {
        analysisResult,
        qaList,
        audioData,
        visualData,
        loading,
        error,
        dataSource,
        sessionId,
        calibration,
        visualNormalizedOverall,
        visualDeviation,
        audioNormalizedRatios,
        visualNormalizedPerQuestion,
        audioNormalizedRatiosPerQuestion,
        visualServerQuestionScores,
        perQuestionTextAnalyses,
    } = useInterviewResult();

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
                {/* <DataSourceAlert dataSource={dataSource} /> */}

                {/* 캘리브레이션 비교 블록 */}
                {/* <CalibrationComparison
                    calibration={calibration}
                    visualData={visualData}
                    visualNormalizedOverall={visualNormalizedOverall}
                    visualDeviation={visualDeviation}
                    audioData={audioData}
                    audioNormalizedRatios={audioNormalizedRatios}
                /> */}

                {/* 리포트 컴포넌트 */}
                <InterviewReport
                    analysisResult={analysisResult}
                    qaList={qaList}
                    audioData={audioData || undefined}
                    visualData={visualData || undefined}
                    perQuestionTextAnalyses={perQuestionTextAnalyses || undefined}
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
                    viewMode={'compare'}
                    calibrationCompare={{
                        visual: {
                            baseline:
                                (calibration as any)?.visualBaseline ||
                                (calibration as any)?.visualBaseline?.overall ||
                                undefined,
                            normalizedOverall: visualNormalizedOverall || undefined,
                            normalizedPerQuestion: visualNormalizedPerQuestion || undefined,
                            serverQuestionScores: visualServerQuestionScores || undefined,
                        },
                        audio: {
                            baseline: (calibration as any)?.audioBaseline || undefined,
                            ratiosOverall: audioNormalizedRatios || undefined,
                            ratiosPerQuestion: audioNormalizedRatiosPerQuestion || undefined,
                        },
                    }}
                />

                {/* 액션 버튼 */}
                <ActionButtons />
            </div>
        </div>
    );
}
