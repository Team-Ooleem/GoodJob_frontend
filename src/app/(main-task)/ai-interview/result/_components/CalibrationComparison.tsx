// result/_components/CalibrationComparison.tsx
'use client';

import { Card, Alert, Tag, Divider } from 'antd';
import { formatNumber } from '../_utils/data-processing';

interface CalibrationComparisonProps {
    calibration: any | null;
    visualData: any;
    visualNormalizedOverall: any | null;
    visualDeviation: number | null;
    audioData: any;
    audioNormalizedRatios: Record<string, number> | null;
}

export default function CalibrationComparison({
    calibration,
    visualData,
    visualNormalizedOverall,
    visualDeviation,
    audioData,
    audioNormalizedRatios,
}: CalibrationComparisonProps) {
    if (!calibration) {
        return (
            <Card className='!border-0 !shadow-lg mb-6' title='캘리브레이션 비교'>
                <Alert type='info' message='이 세션에는 저장된 캘리브레이션이 없습니다.' />
            </Card>
        );
    }

    return (
        <Card className='!border-0 !shadow-lg mb-6' title='캘리브레이션 비교'>
            <div className='space-y-6'>
                {/* 비주얼 비교 */}
                <div>
                    <div className='flex items-center justify-between mb-2'>
                        <div className='font-semibold'>비주얼 (시선/자신감/미소)</div>
                        {typeof visualDeviation === 'number' && (
                            <Tag
                                color={
                                    visualDeviation < 0.3
                                        ? 'green'
                                        : visualDeviation < 0.6
                                          ? 'orange'
                                          : 'red'
                                }
                            >
                                편차 {formatNumber(visualDeviation, 2)}
                            </Tag>
                        )}
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                        <Card size='small'>
                            <div className='text-gray-500 text-sm mb-1'>Baseline</div>
                            <div className='text-sm'>
                                confidence_mean:{' '}
                                {formatNumber(
                                    (calibration as any)?.visualBaseline?.confidence_mean ??
                                        (calibration as any)?.visualBaseline?.overall
                                            ?.confidence_mean,
                                )}
                            </div>
                            <div className='text-sm'>
                                smile_mean:{' '}
                                {formatNumber(
                                    (calibration as any)?.visualBaseline?.smile_mean ??
                                        (calibration as any)?.visualBaseline?.overall?.smile_mean,
                                )}
                            </div>
                        </Card>
                        <Card size='small'>
                            <div className='text-gray-500 text-sm mb-1'>Session Raw</div>
                            <div className='text-sm'>
                                confidence_mean:{' '}
                                {formatNumber(visualData?.overall?.confidence_mean)}
                            </div>
                            <div className='text-sm'>
                                smile_mean: {formatNumber(visualData?.overall?.smile_mean)}
                            </div>
                        </Card>
                        <Card size='small'>
                            <div className='text-gray-500 text-sm mb-1'>Calibrated</div>
                            <div className='text-sm'>
                                confidence_mean:{' '}
                                {formatNumber(visualNormalizedOverall?.confidence_mean)}
                            </div>
                            <div className='text-sm'>
                                smile_mean: {formatNumber(visualNormalizedOverall?.smile_mean)}
                            </div>
                        </Card>
                    </div>
                </div>

                <Divider className='!my-2' />

                {/* 오디오 비교 */}
                <div>
                    <div className='font-semibold mb-2'>오디오 (피치/변동/지터/쉬머/무음)</div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                        <Card size='small'>
                            <div className='text-gray-500 text-sm mb-1'>Baseline</div>
                            <div className='text-sm'>
                                f0_mean:{' '}
                                {formatNumber((calibration as any)?.audioBaseline?.f0_mean)}
                            </div>
                            <div className='text-sm'>
                                f0_std: {formatNumber((calibration as any)?.audioBaseline?.f0_std)}
                            </div>
                            <div className='text-sm'>
                                rms_cv: {formatNumber((calibration as any)?.audioBaseline?.rms_cv)}
                            </div>
                            <div className='text-sm'>
                                jitter_like:{' '}
                                {formatNumber((calibration as any)?.audioBaseline?.jitter_like)}
                            </div>
                            <div className='text-sm'>
                                shimmer_like:{' '}
                                {formatNumber((calibration as any)?.audioBaseline?.shimmer_like)}
                            </div>
                            <div className='text-sm'>
                                silence_ratio:{' '}
                                {formatNumber((calibration as any)?.audioBaseline?.silence_ratio)}
                            </div>
                        </Card>
                        <Card size='small'>
                            <div className='text-gray-500 text-sm mb-1'>Session Raw</div>
                            <div className='text-sm'>
                                f0_mean: {formatNumber(audioData?.overall?.f0_mean)}
                            </div>
                            <div className='text-sm'>
                                f0_std: {formatNumber(audioData?.overall?.f0_std)}
                            </div>
                            <div className='text-sm'>
                                rms_cv: {formatNumber(audioData?.overall?.rms_cv)}
                            </div>
                            <div className='text-sm'>
                                jitter_like: {formatNumber(audioData?.overall?.jitter_like)}
                            </div>
                            <div className='text-sm'>
                                shimmer_like: {formatNumber(audioData?.overall?.shimmer_like)}
                            </div>
                            <div className='text-sm'>
                                silence_ratio: {formatNumber(audioData?.overall?.silence_ratio)}
                            </div>
                        </Card>
                        <Card size='small'>
                            <div className='text-gray-500 text-sm mb-1'>Ratio (raw / baseline)</div>
                            <div className='text-sm'>
                                f0_mean: {formatNumber(audioNormalizedRatios?.f0_mean)}
                            </div>
                            <div className='text-sm'>
                                f0_std: {formatNumber(audioNormalizedRatios?.f0_std)}
                            </div>
                            <div className='text-sm'>
                                rms_cv: {formatNumber(audioNormalizedRatios?.rms_cv)}
                            </div>
                            <div className='text-sm'>
                                jitter_like: {formatNumber(audioNormalizedRatios?.jitter_like)}
                            </div>
                            <div className='text-sm'>
                                shimmer_like: {formatNumber(audioNormalizedRatios?.shimmer_like)}
                            </div>
                            <div className='text-sm'>
                                silence_ratio: {formatNumber(audioNormalizedRatios?.silence_ratio)}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Card>
    );
}
