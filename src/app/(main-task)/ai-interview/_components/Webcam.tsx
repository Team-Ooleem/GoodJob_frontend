'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RealMediaPipeAnalyzer } from './RealMediaPipeAnalyzer';

interface IWebcam {
    css?: string;
    onDetection?: (data: any) => void;
}

export function Webcam({ css, onDetection }: IWebcam) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [detectionData, setDetectionData] = useState<any>(null);
    const mediaPipeAnalyzerRef = useRef<RealMediaPipeAnalyzer | null>(null);
    const isInitializedRef = useRef(false); // 초기화 상태 추적

    // MediaPipe 감지 결과 처리 (useCallback으로 메모이제이션)
    const handleMediaPipeDetection = useCallback((detection: any) => {
        console.log('🎥 MediaPipe 실시간 감지:', {
            timestamp: new Date().toISOString(),
            detection: detection,
            videoElement: {
                width: videoRef.current?.videoWidth || 0,
                height: videoRef.current?.videoHeight || 0,
                readyState: videoRef.current?.readyState || 0,
            },
            streamInfo: {
                active: videoRef.current?.srcObject ? true : false,
                tracks: videoRef.current?.srcObject
                    ? (videoRef.current.srcObject as MediaStream).getTracks().map((track) => ({
                          kind: track.kind,
                          label: track.label,
                          enabled: track.enabled,
                          readyState: track.readyState,
                      }))
                    : [],
            },
        });

        setDetectionData(detection);
        onDetection?.(detection);

        // 3초 후 감지 데이터 초기화 (MediaPipe 5초 간격과 겹치지 않도록)
        setTimeout(() => {
            setDetectionData(null);
        }, 3000);
    }, []); // 의존성 배열을 빈 배열로 수정!

    // 웹캠 스트림 시작 (useCallback으로 메모이제이션)
    const startWebcam = useCallback(async () => {
        // 이미 초기화되었다면 중복 실행 방지
        if (isInitializedRef.current) {
            console.log('⚠️ MediaPipe가 이미 초기화되어 있습니다. 중복 실행을 방지합니다.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
                isInitializedRef.current = true; // 초기화 완료 표시

                // 웹캠 스트림 시작 정보 콘솔 출력
                console.log('📹 웹캠 스트림 시작:', {
                    timestamp: new Date().toISOString(),
                    streamId: stream.id,
                    tracks: stream.getTracks().map((track) => ({
                        kind: track.kind,
                        label: track.label,
                        enabled: track.enabled,
                        readyState: track.readyState,
                        settings: track.getSettings(),
                    })),
                    constraints: {
                        video: {
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                        },
                        audio: false,
                    },
                });

                // 실제 MediaPipe 분석기 초기화 및 시작
                if (canvasRef.current && !mediaPipeAnalyzerRef.current) {
                    console.log('🚀 MediaPipe Face Landmarker 초기화 시작...');
                    mediaPipeAnalyzerRef.current = new RealMediaPipeAnalyzer(
                        videoRef,
                        canvasRef,
                        handleMediaPipeDetection,
                    );

                    // 비디오가 로드된 후 분석 시작
                    videoRef.current.onloadedmetadata = async () => {
                        if (mediaPipeAnalyzerRef.current) {
                            await mediaPipeAnalyzerRef.current.startAnalysis();
                            console.log('✅ MediaPipe Face Landmarker 초기화 완료');
                        }
                    };
                }
            }
        } catch (error) {
            console.error('웹캠 접근 실패:', error);
            console.error('웹캠에 접근할 수 없습니다.');
            isInitializedRef.current = false; // 실패 시 초기화 상태 리셋
        }
    }, []); // 의존성 배열을 빈 배열로 수정!

    useEffect(() => {
        startWebcam();

        return () => {
            console.log('🧹 Webcam 컴포넌트 정리 시작...');

            // MediaPipe 분석기 정리
            if (mediaPipeAnalyzerRef.current) {
                console.log('🔄 MediaPipe 분석기 정리 중...');
                mediaPipeAnalyzerRef.current.dispose();
                mediaPipeAnalyzerRef.current = null;
            }

            // 웹캠 스트림 정리
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
                console.log('📹 웹캠 스트림 정리 완료');
            }

            // 초기화 상태 리셋
            isInitializedRef.current = false;
            console.log('✅ Webcam 컴포넌트 정리 완료');
        };
    }, []); // 의존성 배열을 빈 배열로 수정!

    return (
        <div className={`text-end ${css}`}>
            <div className='mt-4 mr-4 w-[384px] h-[216px] rounded-2xl overflow-hidden bg-gray-400'>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className='w-full h-full object-cover'
                />

                {/* MediaPipe 분석용 캔버스 (투명 오버레이) */}
                <canvas
                    ref={canvasRef}
                    className='absolute top-0 left-0 w-full h-full pointer-events-none'
                    style={{ zIndex: 1 }}
                />

                {/* 감지 상태 오버레이 */}
                {detectionData && (
                    <div className='absolute bottom-2 left-2 right-2 z-10'>
                        <div
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                detectionData.level === 'excellent'
                                    ? 'bg-blue-500 text-white'
                                    : detectionData.level === 'good'
                                      ? 'bg-green-500 text-white'
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

                {/* 스트리밍 상태 표시 */}
                {isStreaming && (
                    <div className='absolute top-2 right-2 z-10'>
                        <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                    </div>
                )}
            </div>
        </div>
    );
}
