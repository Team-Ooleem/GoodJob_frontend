'use client';

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { RealMediaPipeAnalyzer, VisualAggregatePayload } from './RealMediaPipeAnalyzer';

interface IWebcam {
    css?: string;
    onDetection?: (data: any) => void;
    onAggregate?: (agg: VisualAggregatePayload) => void;
    width?: number; // px
    height?: number; // px
    overlayGuide?: boolean; // 가이드 렌더링 (캘리브레이션용)
}

export interface WebcamHandle {
    startQuestion: (questionId: string, opts?: { orderNo?: number; text?: string }) => void;
    endQuestion: () => VisualAggregatePayload | null;
}

export const Webcam = forwardRef<WebcamHandle, IWebcam>(function Webcam(
    { css, onDetection, onAggregate, width = 384, height = 216, overlayGuide = false },
    ref,
) {
    const pathname = usePathname();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [detectionData, setDetectionData] = useState<any>(null);
    const [showBlurEffect, setShowBlurEffect] = useState(false);
    const [blurColor, setBlurColor] = useState<'warning' | 'bad' | null>(null);
    const mediaPipeAnalyzerRef = useRef<RealMediaPipeAnalyzer | null>(null);
    const isInitializedRef = useRef(false);

    // 설정 페이지인지 확인
    const isSettingPage = pathname?.includes('/ai-interview/setting');

    // 1) onDetection을 ref로 보관 → 부모가 함수를 바꿔도 초기화 트리거 안 됨
    const onDetectionRef = useRef<IWebcam['onDetection']>(onDetection);
    useEffect(() => {
        onDetectionRef.current = onDetection;
    }, [onDetection]);

    // 2) 안정적인 핸들러 (ref를 통해 최신 콜백을 부름)
    const handleMediaPipeDetection = (detection: any) => {
        // 로그/표시
        setDetectionData(detection);
        onDetectionRef.current?.(detection);

        // 설정 페이지가 아닐 때만 blur 효과 표시
        if (!isSettingPage && (detection.level === 'warning' || detection.level === 'bad')) {
            setBlurColor(detection.level);
            setShowBlurEffect(true);

            // 2초 후 blur 효과 숨김
            setTimeout(() => {
                setShowBlurEffect(false);
                setTimeout(() => setBlurColor(null), 500); // 애니메이션 완료 후 색상 리셋
            }, 2000);
        }

        // 3초 후 오버레이 숨김
        window.setTimeout(() => setDetectionData(null), 3000);
    };

    // 웹캠/MediaPipe 초기화: 의존성 없이 "한 번"만
    useEffect(() => {
        let stopped = false;

        (async () => {
            if (isInitializedRef.current) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false,
                });
                if (stopped) return;

                const video = videoRef.current;
                if (!video) return;

                video.srcObject = stream;
                setIsStreaming(true);
                isInitializedRef.current = true;

                if (canvasRef.current && !mediaPipeAnalyzerRef.current) {
                    mediaPipeAnalyzerRef.current = new RealMediaPipeAnalyzer(
                        videoRef,
                        canvasRef,
                        handleMediaPipeDetection, // ref 기반이므로 안정적
                    );

                    // onloadedmetadata는 여러 번 불리지 않도록 단발성 실행
                    const startOnce = async () => {
                        // 이미 해제되었으면 무시
                        if (!mediaPipeAnalyzerRef.current) return;
                        await mediaPipeAnalyzerRef.current.startAnalysis();
                    };

                    if (video.readyState >= 1 /* HAVE_METADATA */) {
                        // 이미 메타데이터가 준비된 상태
                        void startOnce();
                    } else {
                        video.onloadedmetadata = () => {
                            void startOnce();
                            // 한 번 실행 후 핸들 제거(중복 방지)
                            video.onloadedmetadata = null;
                        };
                    }
                }
            } catch (err) {
                console.error('웹캠 접근 실패:', err);
                isInitializedRef.current = false;
            }
        })();

        return () => {
            // 실제 언마운트에서만 정리
            stopped = true;

            // MediaPipe 정리
            if (mediaPipeAnalyzerRef.current) {
                mediaPipeAnalyzerRef.current.dispose();
                mediaPipeAnalyzerRef.current = null;
            }

            // 스트림 정리
            const video = videoRef.current;
            const stream = video?.srcObject as MediaStream | null;
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }

            isInitializedRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ★ 의존성 비워서 mount/unmount에만 실행

    // 부모에 start/end 핸들 노출
    useImperativeHandle(
        ref,
        () => ({
            startQuestion: (questionId: string, opts?: { orderNo?: number; text?: string }) => {
                if (!mediaPipeAnalyzerRef.current) return;
                mediaPipeAnalyzerRef.current.startQuestion(questionId, opts);
            },
            endQuestion: () => {
                if (!mediaPipeAnalyzerRef.current) return null;
                const agg = mediaPipeAnalyzerRef.current.endQuestion();
                onAggregate?.(agg);
                return agg;
            },
        }),
        [onAggregate],
    );

    return (
        <div className={`text-end ${css}`}>
            <div
                className='mt-4 mr-4 rounded-2xl overflow-hidden bg-gray-400 relative'
                style={{ width: `${width}px`, height: `${height}px` }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className='w-full h-full object-cover'
                    style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
                    ref={canvasRef}
                    className='absolute top-0 left-0 w-full h-full pointer-events-none'
                    style={{ zIndex: 1, transform: 'scaleX(-1)' }}
                />
                {detectionData && !overlayGuide && (
                    <div className='absolute bottom-2 left-2 right-2 z-10'>
                        <div
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                detectionData.level === 'excellent'
                                    ? 'bg-blue-500 text-white'
                                    : detectionData.level === 'good'
                                      ? 'bg-green-500 text-white'
                                      : detectionData.level === 'bad'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-yellow-500 text-black'
                            }`}
                        >
                            <div className='flex items-center gap-2'>
                                <span className='text-xs'>
                                    {detectionData.type === 'confidence'
                                        ? '💪'
                                        : detectionData.type === 'attention'
                                          ? '👁️'
                                          : detectionData.type === 'stress'
                                            ? '😌'
                                            : detectionData.type === 'smile'
                                              ? '😊'
                                              : detectionData.type === 'eye_contact'
                                                ? '👀'
                                                : '✨'}
                                </span>
                                {detectionData.message}
                            </div>
                        </div>
                    </div>
                )}
                {overlayGuide &&
                    (() => {
                        const innerW = Math.round(width * 0.5);
                        const innerH = Math.round(height * 0.7);
                        const topGap = Math.round((height - innerH) / 2);
                        const sideGap = Math.round((width - innerW) / 2);
                        return (
                            <div className='absolute inset-0 pointer-events-none z-10'>
                                {/* Dimmed regions outside the guide box */}
                                <div
                                    className='absolute left-0 top-0 bg-black/25'
                                    style={{ width: '100%', height: topGap }}
                                />
                                <div
                                    className='absolute left-0'
                                    style={{
                                        top: topGap,
                                        width: sideGap,
                                        height: innerH,
                                        background: 'rgba(0,0,0,0.25)',
                                    }}
                                />
                                <div
                                    className='absolute right-0'
                                    style={{
                                        top: topGap,
                                        width: sideGap,
                                        height: innerH,
                                        background: 'rgba(0,0,0,0.25)',
                                    }}
                                />
                                <div
                                    className='absolute left-0 bottom-0 bg-black/25'
                                    style={{ width: '100%', height: topGap }}
                                />

                                {/* Guide rectangle */}
                                <div
                                    className='absolute rounded-xl border-2'
                                    style={{
                                        left: sideGap,
                                        top: topGap,
                                        width: innerW,
                                        height: innerH,
                                        borderColor: 'rgba(255,255,255,0.9)',
                                        boxShadow: '0 0 0 4px rgba(255,255,255,0.3) inset',
                                        backdropFilter: 'saturate(120%)',
                                    }}
                                />
                            </div>
                        );
                    })()}
                {isStreaming && (
                    <div className='absolute top-2 right-2 z-10'>
                        <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                    </div>
                )}
            </div>

            {/* Viewport 전체에 고정된 blur 효과 - Portal로 body에 직접 렌더링 (설정 페이지에서는 비활성화) */}
            {!isSettingPage &&
                showBlurEffect &&
                blurColor &&
                typeof window !== 'undefined' &&
                createPortal(
                    <div className='fixed inset-0 pointer-events-none z-[9999]'>
                        {/* 상단 blur */}
                        <div
                            className={`fixed top-0 left-0 right-0 h-8 ${
                                blurColor === 'warning' ? 'bg-yellow-400/50' : 'bg-red-400/50'
                            }`}
                            style={{
                                animation: 'blurPulse 0.8s ease-in-out 1',
                                filter: 'blur(20px)',
                            }}
                        />
                        {/* 하단 blur */}
                        <div
                            className={`fixed bottom-0 left-0 right-0 h-8 ${
                                blurColor === 'warning' ? 'bg-yellow-400/50' : 'bg-red-400/50'
                            }`}
                            style={{
                                animation: 'blurPulse 0.8s ease-in-out 1',
                                filter: 'blur(20px)',
                            }}
                        />
                        {/* 좌측 blur */}
                        <div
                            className={`fixed top-0 bottom-0 left-0 w-8 ${
                                blurColor === 'warning' ? 'bg-yellow-400/50' : 'bg-red-400/50'
                            }`}
                            style={{
                                animation: 'blurPulse 0.8s ease-in-out 1',
                                filter: 'blur(20px)',
                            }}
                        />
                        {/* 우측 blur */}
                        <div
                            className={`fixed top-0 bottom-0 right-0 w-8 ${
                                blurColor === 'warning' ? 'bg-yellow-400/50' : 'bg-red-400/50'
                            }`}
                            style={{
                                animation: 'blurPulse 0.8s ease-in-out 1',
                                filter: 'blur(20px)',
                            }}
                        />
                    </div>,
                    document.body,
                )}
        </div>
    );
});
