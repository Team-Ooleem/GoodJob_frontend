'use client';

interface DetectionResult {
    type: 'posture' | 'eye_contact' | 'smile' | 'gesture' | 'confidence' | 'attention' | 'stress';
    message: string;
    level: 'good' | 'warning' | 'excellent';
    confidence: number;
    landmarks: any;
    metrics: any;
}

export class RealMediaPipeAnalyzer {
    private videoRef: React.RefObject<HTMLVideoElement>;
    private canvasRef: React.RefObject<HTMLCanvasElement>;
    private onDetection: (data: DetectionResult) => void;
    private isAnalyzing = false;
    private animationFrameId: number | null = null;
    private lastLogTime = 0;
    private logInterval = 10000; // 10초마다 분석 결과 로그 출력
    private analysisInterval = 5000; // 5초마다 분석 실행
    private lastAnalysisTime = 0;

    // MediaPipe Tasks Vision 모델들
    private faceLandmarker: any = null;
    private vision: any = null;
    private isInitialized = false; // 초기화 상태 추적

    // 분석 결과 저장
    private lastFaceResults: any = null;
    private lastDetectionTime = 0;
    private lastAnalysisLogTime = 0;
    private hasLoggedInitialData = false; // 최초 웹캠 데이터 로그 여부

    constructor(
        videoRef: React.RefObject<HTMLVideoElement>,
        canvasRef: React.RefObject<HTMLCanvasElement>,
        onDetection: (data: DetectionResult) => void,
    ) {
        this.videoRef = videoRef;
        this.canvasRef = canvasRef;
        this.onDetection = onDetection;
    }

    // MediaPipe Tasks Vision 모델 초기화
    public async initializeModels() {
        // 이미 초기화되었다면 중복 실행 방지
        if (this.isInitialized) {
            console.log('⚠️ MediaPipe 모델이 이미 초기화되어 있습니다. 중복 실행을 방지합니다.');
            return;
        }

        try {
            console.log('🚀 MediaPipe Tasks Vision 모델 초기화 시작...');

            // 🔑 SSR 회피: 런타임에서만 동적 import
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            console.log('📦 MediaPipe Tasks Vision 라이브러리 로딩 완료');

            // 🔑 WASM 자산 경로 (정적 폴더에 복사된 파일들)
            console.log('🔧 WASM 파일셋 초기화 중...');
            this.vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
            console.log('✅ WASM 파일셋 초기화 완료');

            // Face Landmarker 모델 초기화
            console.log('👁️ Face Landmarker 모델 초기화 중...');
            this.faceLandmarker = await FaceLandmarker.createFromOptions(this.vision, {
                baseOptions: {
                    modelAssetPath: '/mediapipe/face_landmarker.task', // public/mediapipe 에 배치
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: false,
                runningMode: 'VIDEO',
                numFaces: 1,
            });

            this.isInitialized = true; // 초기화 완료 표시
            console.log('✅ MediaPipe Tasks Vision 모델 초기화 완료');
        } catch (error) {
            console.error('❌ MediaPipe Tasks Vision 모델 초기화 실패:', error);
            this.isInitialized = false; // 실패 시 초기화 상태 리셋
            throw error;
        }
    }

    // Face Landmarker 분석 결과 처리
    private analyzeFaceResults(results: any) {
        // 10초마다만 분석 결과 로그 출력
        const currentTime = Date.now();
        if (currentTime - this.lastAnalysisLogTime >= this.logInterval) {
            console.log('👁️ Face Landmarker 분석 결과 (10초마다):', {
                timestamp: new Date().toISOString(),
                hasLandmarks: !!results.faceLandmarks,
                facesCount: results.faceLandmarks?.length || 0,
                hasBlendshapes: !!results.faceBlendshapes,
                blendshapesCount: results.faceBlendshapes?.length || 0,
                firstFaceLandmarks: results.faceLandmarks?.[0]
                    ? results.faceLandmarks[0].slice(0, 5)
                    : null,
            });
            this.lastAnalysisLogTime = currentTime;
        }

        // 🔍 원본 MediaPipe 데이터 로그 출력 (5초마다)
        if (currentTime - this.lastAnalysisLogTime >= this.logInterval) {
            console.log('📊 MediaPipe 원본 데이터 (10초마다):', {
                timestamp: new Date().toISOString(),
                rawResults: {
                    faceLandmarks: results.faceLandmarks?.[0]
                        ? {
                              count: results.faceLandmarks[0].length,
                              sample: results.faceLandmarks[0].slice(0, 10), // 처음 10개 랜드마크
                              eyeLandmarks: {
                                  leftEye: results.faceLandmarks[0][159], // 왼쪽 눈 중심
                                  rightEye: results.faceLandmarks[0][386], // 오른쪽 눈 중심
                                  noseTip: results.faceLandmarks[0][1], // 코 끝
                              },
                          }
                        : null,
                    faceBlendshapes: results.faceBlendshapes?.[0]
                        ? {
                              categories:
                                  results.faceBlendshapes[0].categories?.map((cat: any) => ({
                                      categoryName: cat.categoryName,
                                      score: cat.score,
                                  })) || [],
                          }
                        : null,
                },
            });
        }

        if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
            return;
        }

        const faceLandmarks = results.faceLandmarks[0];
        const faceBlendshapes = results.faceBlendshapes?.[0];

        // 시선 분석 (눈 랜드마크들)
        // MediaPipe Face Landmarker의 468개 랜드마크 중 눈 관련 랜드마크들
        const leftEyeCenter = faceLandmarks[159]; // 왼쪽 눈 중심
        const rightEyeCenter = faceLandmarks[386]; // 오른쪽 눈 중심
        const noseTip = faceLandmarks[1]; // 코 끝

        const eyeContactScore = 1 - Math.abs((leftEyeCenter.x + rightEyeCenter.x) / 2 - 0.5);

        // 면접용 종합 표정 분석 (Blendshapes 사용)
        const interviewMetrics = this.calculateInterviewMetrics(faceBlendshapes, faceLandmarks);

        // 🔍 가공된 메트릭 데이터 로그 출력 (10초마다)
        const metricsLogTime = Date.now();
        if (metricsLogTime - this.lastAnalysisLogTime >= this.logInterval) {
            console.log('🎯 가공된 면접 메트릭 데이터 (10초마다):', {
                timestamp: new Date().toISOString(),
                processedMetrics: {
                    confidence: interviewMetrics.confidence,
                    stress: interviewMetrics.stress,
                    attention: interviewMetrics.attention,
                    engagement: interviewMetrics.engagement,
                    eyeContact: interviewMetrics.eyeContact,
                    smile: interviewMetrics.smile,
                    nervousness: interviewMetrics.nervousness,
                    composure: interviewMetrics.composure,
                },
                rawLandmarks: {
                    leftEye: { x: leftEyeCenter.x, y: leftEyeCenter.y, z: leftEyeCenter.z },
                    rightEye: { x: rightEyeCenter.x, y: rightEyeCenter.y, z: rightEyeCenter.z },
                    nose: { x: noseTip.x, y: noseTip.y, z: noseTip.z },
                },
            });
        }

        // 각 메트릭에 대한 피드백 생성
        this.generateInterviewFeedback(interviewMetrics, leftEyeCenter, rightEyeCenter, noseTip);
    }

    // 면접용 메트릭 계산
    private calculateInterviewMetrics(faceBlendshapes: any, faceLandmarks: any) {
        const metrics = {
            confidence: 0,
            stress: 0,
            attention: 0,
            engagement: 0,
            eyeContact: 0,
            smile: 0,
            nervousness: 0,
            composure: 0,
        };

        if (!faceBlendshapes?.categories) return metrics;

        const blendshapes = faceBlendshapes.categories;

        // 자신감 지표 (미소, 눈썹 위치, 턱 각도)
        const smileLeft =
            blendshapes.find((cat: any) => cat.categoryName === 'mouthSmileLeft')?.score || 0;
        const smileRight =
            blendshapes.find((cat: any) => cat.categoryName === 'mouthSmileRight')?.score || 0;
        const browInnerUp =
            blendshapes.find((cat: any) => cat.categoryName === 'browInnerUp')?.score || 0;
        const browOuterUpLeft =
            blendshapes.find((cat: any) => cat.categoryName === 'browOuterUpLeft')?.score || 0;
        const browOuterUpRight =
            blendshapes.find((cat: any) => cat.categoryName === 'browOuterUpRight')?.score || 0;

        metrics.smile = (smileLeft + smileRight) / 2;
        metrics.confidence =
            metrics.smile * 0.4 +
            (browOuterUpLeft + browOuterUpRight) * 0.3 +
            (1 - browInnerUp) * 0.3;

        // 스트레스/긴장 지표 (눈썹 찌푸림, 입 압박, 턱 긴장)
        const browDownLeft =
            blendshapes.find((cat: any) => cat.categoryName === 'browDownLeft')?.score || 0;
        const browDownRight =
            blendshapes.find((cat: any) => cat.categoryName === 'browDownRight')?.score || 0;
        const mouthPressLeft =
            blendshapes.find((cat: any) => cat.categoryName === 'mouthPressLeft')?.score || 0;
        const mouthPressRight =
            blendshapes.find((cat: any) => cat.categoryName === 'mouthPressRight')?.score || 0;
        const jawOpen = blendshapes.find((cat: any) => cat.categoryName === 'jawOpen')?.score || 0;

        metrics.stress = (browDownLeft + browDownRight + mouthPressLeft + mouthPressRight) / 4;
        metrics.nervousness = metrics.stress;

        // 집중도/주의력 지표 (눈 깜빡임, 시선)
        const eyeBlinkLeft =
            blendshapes.find((cat: any) => cat.categoryName === 'eyeBlinkLeft')?.score || 0;
        const eyeBlinkRight =
            blendshapes.find((cat: any) => cat.categoryName === 'eyeBlinkRight')?.score || 0;
        const eyeLookDownLeft =
            blendshapes.find((cat: any) => cat.categoryName === 'eyeLookDownLeft')?.score || 0;
        const eyeLookDownRight =
            blendshapes.find((cat: any) => cat.categoryName === 'eyeLookDownRight')?.score || 0;

        metrics.attention = 1 - (eyeBlinkLeft + eyeBlinkRight) / 2;
        metrics.eyeContact = 1 - (eyeLookDownLeft + eyeLookDownRight) / 2;

        // 참여도/적극성 지표 (전체적인 표정 활동성)
        const cheekPuff =
            blendshapes.find((cat: any) => cat.categoryName === 'cheekPuff')?.score || 0;
        const mouthFunnel =
            blendshapes.find((cat: any) => cat.categoryName === 'mouthFunnel')?.score || 0;

        metrics.engagement = (metrics.smile + metrics.attention + (1 - cheekPuff)) / 3;
        metrics.composure = 1 - metrics.stress;

        return metrics;
    }

    // 면접 피드백 생성 (하나의 피드백만 우선적으로 표시)
    private generateInterviewFeedback(metrics: any, leftEye: any, rightEye: any, nose: any) {
        const landmarks = {
            leftEye: { x: leftEye.x, y: leftEye.y },
            rightEye: { x: rightEye.x, y: rightEye.y },
            nose: { x: nose.x, y: nose.y },
        };

        // 피드백 우선순위: 스트레스 > 집중도 > 자신감 > 미소
        // 가장 중요한 피드백 하나만 선택하여 표시

        // 1순위: 스트레스/긴장 피드백 (가장 중요)
        if (metrics.stress > 0.6) {
            this.onDetection({
                type: 'stress',
                message: '긴장을 풀고 편안한 마음으로 답변해보세요',
                level: 'warning',
                confidence: 1 - metrics.stress,
                landmarks,
                metrics: {
                    stressLevel: metrics.stress,
                    nervousness: metrics.nervousness,
                    relaxationNeeded: true,
                },
            });
            return; // 다른 피드백은 표시하지 않음
        }

        // 2순위: 집중도/아이컨택 피드백
        if (metrics.attention < 0.5 || metrics.eyeContact < 0.5) {
            this.onDetection({
                type: 'attention',
                message: '면접관과의 아이컨택을 더 유지해보세요',
                level: 'warning',
                confidence: Math.max(metrics.attention, metrics.eyeContact),
                landmarks,
                metrics: {
                    attentionScore: metrics.attention,
                    eyeContactScore: metrics.eyeContact,
                    focusLevel: 'needs_improvement',
                },
            });
            return; // 다른 피드백은 표시하지 않음
        }

        // 3순위: 자신감 피드백
        if (metrics.confidence < 0.4) {
            this.onDetection({
                type: 'confidence',
                message: '좀 더 자신감 있는 표정을 지어보세요',
                level: 'warning',
                confidence: metrics.confidence,
                landmarks,
                metrics: {
                    confidenceScore: metrics.confidence,
                    smileIntensity: metrics.smile,
                    overallPresence: 'needs_improvement',
                },
            });
            return; // 다른 피드백은 표시하지 않음
        }

        // 4순위: 긍정적 피드백 (모든 지표가 양호할 때만)
        if (metrics.confidence > 0.7) {
            this.onDetection({
                type: 'confidence',
                message: '자신감 있는 표정이 인상적입니다!',
                level: 'excellent',
                confidence: metrics.confidence,
                landmarks,
                metrics: {
                    confidenceScore: metrics.confidence,
                    smileIntensity: metrics.smile,
                    overallPresence: 'confident',
                },
            });
            return;
        }

        if (metrics.attention > 0.8 && metrics.eyeContact > 0.7) {
            this.onDetection({
                type: 'attention',
                message: '훌륭한 집중력과 아이컨택을 보여주고 있습니다',
                level: 'excellent',
                confidence: (metrics.attention + metrics.eyeContact) / 2,
                landmarks,
                metrics: {
                    attentionScore: metrics.attention,
                    eyeContactScore: metrics.eyeContact,
                    focusLevel: 'high',
                },
            });
            return;
        }

        if (metrics.smile > 0.4) {
            this.onDetection({
                type: 'smile',
                message: '자연스러운 미소가 좋은 인상을 줍니다',
                level: 'good',
                confidence: metrics.smile,
                landmarks,
                metrics: {
                    smileIntensity: metrics.smile,
                    facialExpression: 'positive',
                    warmth: 'high',
                },
            });
            return;
        }
    }

    // 메인 분석 함수 (requestVideoFrameCallback 사용)
    private analyzeFrame() {
        if (!this.isAnalyzing || !this.videoRef.current || !this.canvasRef.current) {
            return;
        }

        const video = this.videoRef.current;
        const canvas = this.canvasRef.current;

        if (video.readyState !== 4 || !this.faceLandmarker) {
            // requestVideoFrameCallback 사용 (더 정확한 프레임 동기화)
            if ('requestVideoFrameCallback' in video) {
                (video as any).requestVideoFrameCallback(() => this.analyzeFrame());
            } else {
                // 폴백: requestAnimationFrame
                this.animationFrameId = requestAnimationFrame(() => this.analyzeFrame());
            }
            return;
        }

        // 캔버스 크기를 비디오와 맞춤
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 최초 한번만 웹캠 데이터 로그 출력
        const currentTime = Date.now();
        if (!this.hasLoggedInitialData) {
            this.logWebcamData(video, canvas);
            this.hasLoggedInitialData = true;
            this.lastLogTime = currentTime;
        }

        // 성능 최적화: 5초 간격으로만 분석 실행
        const timeSinceLastAnalysis = currentTime - this.lastAnalysisTime;
        if (timeSinceLastAnalysis < this.analysisInterval) {
            // 5초 간격이 지나지 않았으면 다음 프레임으로
            if ('requestVideoFrameCallback' in video) {
                (video as any).requestVideoFrameCallback(() => this.analyzeFrame());
            } else {
                this.animationFrameId = requestAnimationFrame(() => this.analyzeFrame());
            }
            return;
        }

        try {
            // MediaPipe Face Landmarker로 비디오 프레임 분석
            const results = this.faceLandmarker.detectForVideo(video, currentTime);

            if (results) {
                this.lastFaceResults = results;
                this.lastDetectionTime = currentTime;
                this.lastAnalysisTime = currentTime; // 분석 시간 업데이트
                this.analyzeFaceResults(results);
            }

            // 프레임 전송 로그는 제거 (너무 많은 로그 방지)
        } catch (error) {
            console.error('❌ Face Landmarker 감지 오류:', error);
        }

        // 다음 프레임 분석 예약
        if ('requestVideoFrameCallback' in video) {
            (video as any).requestVideoFrameCallback(() => this.analyzeFrame());
        } else {
            this.animationFrameId = requestAnimationFrame(() => this.analyzeFrame());
        }
    }

    // 웹캠 데이터 로그 출력
    private logWebcamData(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
        const stream = video.srcObject as MediaStream;
        const tracks = stream?.getTracks() || [];

        console.log('📊 MediaPipe Tasks Vision 웹캠 데이터 (최초 1회):', {
            timestamp: new Date().toISOString(),
            videoInfo: {
                width: video.videoWidth,
                height: video.videoHeight,
                currentTime: video.currentTime,
                duration: video.duration,
                readyState: video.readyState,
                paused: video.paused,
                muted: video.muted,
                volume: video.volume,
            },
            canvasInfo: {
                width: canvas.width,
                height: canvas.height,
            },
            streamInfo: {
                id: stream?.id,
                active: stream?.active,
                tracksCount: tracks.length,
                tracks: tracks.map((track) => ({
                    kind: track.kind,
                    label: track.label,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    muted: track.muted,
                    settings: track.getSettings(),
                    constraints: track.getConstraints(),
                })),
            },
            mediaPipeResults: {
                faceLandmarker: this.lastFaceResults
                    ? {
                          facesCount: this.lastFaceResults.faceLandmarks?.length || 0,
                          blendshapesCount: this.lastFaceResults.faceBlendshapes?.length || 0,
                          hasResults: true,
                      }
                    : { hasResults: false },
            },
            performanceInfo: {
                frameRate: '5초 간격 분석 중 (성능 최적화)',
                memoryUsage: (performance as any).memory
                    ? {
                          used:
                              Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) +
                              'MB',
                          total:
                              Math.round(
                                  (performance as any).memory.totalJSHeapSize / 1024 / 1024,
                              ) + 'MB',
                          limit:
                              Math.round(
                                  (performance as any).memory.jsHeapSizeLimit / 1024 / 1024,
                              ) + 'MB',
                      }
                    : 'N/A',
            },
            analysisStatus: {
                isAnalyzing: this.isAnalyzing,
                faceLandmarkerReady: !!this.faceLandmarker,
                hasLoggedInitialData: this.hasLoggedInitialData,
                initialLogTime: new Date(this.lastLogTime).toISOString(),
            },
        });
    }

    // 분석 시작
    public async startAnalysis() {
        if (this.isAnalyzing) return;

        try {
            // MediaPipe Tasks Vision 모델 초기화
            await this.initializeModels();

            // 모델이 준비될 때까지 잠시 대기
            await new Promise((resolve) => setTimeout(resolve, 1000));

            this.isAnalyzing = true;
            this.lastDetectionTime = Date.now();
            this.lastAnalysisTime = Date.now();
            console.log('🎯 MediaPipe Tasks Vision 분석 시작 (5초 간격)');
            this.analyzeFrame();
        } catch (error) {
            console.error('❌ MediaPipe Tasks Vision 분석 시작 실패:', error);
            throw error;
        }
    }

    // 분석 중지
    public stopAnalysis() {
        this.isAnalyzing = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log('⏹️ MediaPipe Tasks Vision 분석 중지');
    }

    // 리소스 정리
    public dispose() {
        console.log('🧹 MediaPipe Tasks Vision 리소스 정리 시작...');
        this.stopAnalysis();

        if (this.faceLandmarker) {
            console.log('🔄 Face Landmarker 정리 중...');
            this.faceLandmarker.close();
            this.faceLandmarker = null;
        }

        if (this.vision) {
            this.vision = null;
        }

        // 초기화 상태 리셋
        this.isInitialized = false;
        console.log('✅ MediaPipe Tasks Vision 리소스 정리 완료');
    }
}
