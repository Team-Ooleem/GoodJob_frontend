'use client';

interface DetectionResult {
    type: 'posture' | 'eye_contact' | 'smile' | 'gesture' | 'confidence' | 'attention' | 'stress';
    message: string;
    level: 'good' | 'warning' | 'excellent';
    confidence: number;
    landmarks: any;
    metrics: any;
}

type Presence = 'good' | 'average' | 'needs_improvement';
type LevelAgg = 'ok' | 'info' | 'warning' | 'critical';

// 서버에 보낼 문항 집계 페이로드 (Nest의 VisualAggregateDto와 1:1)
export type VisualAggregatePayload = {
    sample_count: number;

    confidence_mean: number | null;
    confidence_max: number | null;
    smile_mean: number | null;
    smile_max: number | null;

    // 추가 지표(평균)
    eye_contact_mean: number | null; // 0~1
    blink_mean: number | null; // 0~1 (깜빡임 확률 프록시)
    gaze_stability: number | null; // 0~1 (높을수록 안정)

    presence_good: number;
    presence_average: number;
    presence_needs_improvement: number;

    level_ok: number;
    level_info: number;
    level_warning: number;
    level_critical: number;

    left_eye_x_mean: number | null;
    left_eye_y_mean: number | null;
    right_eye_x_mean: number | null;
    right_eye_y_mean: number | null;
    nose_x_mean: number | null;
    nose_y_mean: number | null;

    started_at_ms: number | null;
    ended_at_ms: number | null;

    // (선택) 클라이언트 편의를 위한 메타
    _questionId?: string;
    _orderNo?: number;
    _text?: string;
};

// 내부 버퍼에 저장할 샘플 스키마(경량)
type VisualSampleLite = {
    timestamp: string; // ISO
    detection: {
        confidenceScore?: number;
        smileIntensity?: number;
        eyeContact?: number; // 0~1
        blinkProb?: number; // 0~1
        overallPresence?: Presence;
        level?: LevelAgg;
        landmarks: {
            leftEye?: { x: number; y: number };
            rightEye?: { x: number; y: number };
            nose?: { x: number; y: number };
        };
    };
};

export class RealMediaPipeAnalyzer {
    private videoRef: React.RefObject<HTMLVideoElement>;
    private canvasRef: React.RefObject<HTMLCanvasElement>;
    private onDetection: (data: DetectionResult) => void;

    private isAnalyzing = false;
    private animationFrameId: number | null = null;
    private lastLogTime = 0;
    private logInterval = 10000; // 10초마다 분석 결과 로그 출력
    private analysisInterval = 2000; // 2초마다 분석 실행
    private lastAnalysisTime = 0;

    // MediaPipe Tasks Vision
    private faceLandmarker: any = null;
    private vision: any = null;
    private isInitialized = false;

    // 상태
    private lastFaceResults: any = null;
    private lastDetectionTime = 0;
    private lastAnalysisLogTime = 0;
    private hasLoggedInitialData = false;
    
    // 캘리브레이션 구성(로컬 저장 기반)
    private calib: {
        baselineConfidence?: number | null;
        baselineSmile?: number | null;
        presenceGoodCut: number;
        presenceNeedsCut: number;
        confWarnThreshold: number;
        confGoodThreshold: number;
        attentionWarnThreshold: number;
        stressWarnThreshold: number;
    } | null = null;
    // 반복 경고 완화용 쿨다운
    private lastFeedbackType: string | null = null;
    private lastFeedbackTime = 0;
    private readonly feedbackCooldownMs = 5000; // 동일 타입 5초 쿨다운
    // 지표 스무딩용 버퍼
    private prevMetrics: {
        confidence: number;
        stress: number;
        attention: number;
        engagement: number;
        eyeContact: number;
        smile: number;
        nervousness: number;
        composure: number;
    } | null = null;
    private readonly smoothAlpha = 0.3; // EMA 계수(0.0~1.0)

    // ▼ 추가: 문항 버퍼링/메타
    private currentQuestionId: string | null = null;
    private currentOrderNo: number | undefined;
    private currentQuestionText: string | undefined;
    private sampleBuffer: VisualSampleLite[] = [];
    private questionStartedAt: number | null = null;

    constructor(
        videoRef: React.RefObject<HTMLVideoElement>,
        canvasRef: React.RefObject<HTMLCanvasElement>,
        onDetection: (data: DetectionResult) => void,
    ) {
        this.videoRef = videoRef;
        this.canvasRef = canvasRef;
        this.onDetection = onDetection;
    }

    private clamp01(v: number) {
        return Math.max(0, Math.min(1, v));
    }

    private loadCalibration() {
        try {
            if (typeof window === 'undefined') return;
            const raw = localStorage.getItem('aiInterviewCalibration');
            if (!raw) {
                this.calib = {
                    presenceGoodCut: 0.6,
                    presenceNeedsCut: 0.4,
                    confWarnThreshold: 0.3,
                    confGoodThreshold: 0.65,
                    attentionWarnThreshold: 0.45,
                    stressWarnThreshold: 0.6,
                };
                return;
            }
            const data = JSON.parse(raw) as any;
            const v = data?.visual as VisualAggregatePayload | undefined;
            const baselineConfidence = typeof v?.confidence_mean === 'number' ? v.confidence_mean : null;
            const baselineSmile = typeof v?.smile_mean === 'number' ? v.smile_mean : null;

            const baseConf = baselineConfidence ?? 0.6;
            const confWarn = Math.max(0.25, baseConf - 0.15);
            const confGood = Math.min(0.9, baseConf + 0.08);
            const presGood = this.clamp01(0.6 + (baseConf - 0.6) * 0.5);
            const presNeeds = this.clamp01(presGood - 0.2);

            this.calib = {
                baselineConfidence,
                baselineSmile,
                presenceGoodCut: presGood,
                presenceNeedsCut: presNeeds,
                confWarnThreshold: confWarn,
                confGoodThreshold: confGood,
                attentionWarnThreshold: 0.45,
                stressWarnThreshold: 0.6,
            };
            // console.debug('[Calibration] Loaded visual calibration:', this.calib);
        } catch (e) {
            // console.warn('[Calibration] Failed to load calibration. Using defaults.', e);
            this.calib = {
                presenceGoodCut: 0.6,
                presenceNeedsCut: 0.4,
                confWarnThreshold: 0.3,
                confGoodThreshold: 0.65,
                attentionWarnThreshold: 0.45,
                stressWarnThreshold: 0.6,
            };
        }
    }

    // ===========================
    // Public: 문항 시작/종료 API
    // ===========================
    public startQuestion(questionId: string, opts?: { orderNo?: number; text?: string }) {
        this.currentQuestionId = questionId;
        this.currentOrderNo = opts?.orderNo;
        this.currentQuestionText = opts?.text;
        this.sampleBuffer = [];
        this.questionStartedAt = Date.now();
        if (questionId === 'calibration') {
            console.log('[Calibration] 비디오 캘리브레이션 시작');
        }
        // 최초 한두 프레임은 분석 이전일 수 있어 샘플 없을 수 있음(OK)
        // 별도 로그만
        // console.log('[Mediapipe] startQuestion:', questionId, opts);
    }

    public endQuestion(): VisualAggregatePayload {
        const payload = this.computeAggregate(this.sampleBuffer);
        // 메타 포함
        payload._questionId = this.currentQuestionId ?? undefined;
        payload._orderNo = this.currentOrderNo;
        payload._text = this.currentQuestionText;

        // 다음 문항 위해 리셋
        this.currentQuestionId = null;
        this.currentOrderNo = undefined;
        this.currentQuestionText = undefined;
        this.sampleBuffer = [];
        this.questionStartedAt = null;
        if (payload._questionId === 'calibration') {
            console.log('[Calibration] 비디오 캘리브레이션 종료 - samples:', payload.sample_count);
        }

        return payload;
    }

    // ===========================
    // MediaPipe 초기화/루프
    // ===========================
    public async initializeModels() {
        if (this.isInitialized) {
            console.log('⚠️ MediaPipe 모델이 이미 초기화되어 있습니다. 중복 실행 방지.');
            return;
        }
        try {
            console.log('🚀 MediaPipe Tasks Vision 모델 초기화 시작...');
            const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
            this.vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
            this.faceLandmarker = await FaceLandmarker.createFromOptions(this.vision, {
                baseOptions: { modelAssetPath: '/mediapipe/face_landmarker.task' },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: false,
                runningMode: 'VIDEO',
                numFaces: 1,
            });
            this.isInitialized = true;
            console.log('✅ MediaPipe Tasks Vision 모델 초기화 완료');
            // 초기화 후 캘리브레이션 로드
            this.loadCalibration();
        } catch (error) {
            console.error('❌ MediaPipe Tasks Vision 모델 초기화 실패:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    private analyzeFaceResults(results: any) {
        const currentTime = Date.now();

        // 10초마다 요약 로그 (문항 수집 중일 때만)
        if (this.currentQuestionId && currentTime - this.lastAnalysisLogTime >= this.logInterval) {
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

        if (!results.faceLandmarks || results.faceLandmarks.length === 0) return;

        const faceLandmarks = results.faceLandmarks[0];
        const faceBlendshapes = results.faceBlendshapes?.[0];

        const leftEyeCenter = faceLandmarks[159];
        const rightEyeCenter = faceLandmarks[386];
        const noseTip = faceLandmarks[1];

        const rawMetrics = this.calculateInterviewMetrics(faceBlendshapes, faceLandmarks);
        // 지표 스무딩(EMA) 적용
        const mPrev = this.prevMetrics;
        const a = this.smoothAlpha;
        const interviewMetrics = mPrev
            ? {
                  confidence: a * rawMetrics.confidence + (1 - a) * mPrev.confidence,
                  stress: a * rawMetrics.stress + (1 - a) * mPrev.stress,
                  attention: a * rawMetrics.attention + (1 - a) * mPrev.attention,
                  engagement: a * rawMetrics.engagement + (1 - a) * mPrev.engagement,
                  eyeContact: a * rawMetrics.eyeContact + (1 - a) * mPrev.eyeContact,
                  smile: a * rawMetrics.smile + (1 - a) * mPrev.smile,
                  nervousness: a * rawMetrics.nervousness + (1 - a) * mPrev.nervousness,
                  composure: a * rawMetrics.composure + (1 - a) * mPrev.composure,
              }
            : rawMetrics;
        this.prevMetrics = interviewMetrics;

        // ▼ 실시간 피드백: 답변(문항) 진행 중일 때만 표시/발생
        if (this.currentQuestionId) {
            this.generateInterviewFeedback(interviewMetrics, leftEyeCenter, rightEyeCenter, noseTip);
        }

        // ▼ 추가: 5초 간격 분석시 **버퍼에 샘플 기록** (문항 진행중일 때만)
        if (this.currentQuestionId) {
            // 존재감(presence): 자신감/집중/긴장완화(1-stress) 가중합
            const presenceScore =
                0.5 * interviewMetrics.confidence +
                0.3 * interviewMetrics.attention +
                0.2 * (1 - interviewMetrics.stress);
            const goodCut = this.calib?.presenceGoodCut ?? 0.6;
            const needsCut = this.calib?.presenceNeedsCut ?? 0.4;
            const presence: Presence =
                presenceScore >= goodCut
                    ? 'good'
                    : presenceScore < needsCut
                      ? 'needs_improvement'
                      : 'average';

            // level 매핑: 스트레스가 높은 구간만 'warning'
            const level: LevelAgg =
                interviewMetrics.stress > (this.calib?.stressWarnThreshold ?? 0.6)
                    ? 'warning'
                    : 'ok';

            const sample: VisualSampleLite = {
                timestamp: new Date().toISOString(),
                detection: {
                    confidenceScore: interviewMetrics.confidence,
                    smileIntensity: interviewMetrics.smile,
                    eyeContact: interviewMetrics.eyeContact,
                    // 깜빡임 확률: attention 산식에 포함되나, 별도 보관을 위해 rough 추정
                    // calculateInterviewMetrics 내부 blink를 직접 사용하지 않으므로, attention에서 추정 불가.
                    // 여기서는 이전 단계 rawMetrics를 사용하도록 calculateInterviewMetrics를 확장(아래 참조).
                    blinkProb: (this as any)._lastBlinkProb ?? undefined,
                    overallPresence: presence,
                    level,
                    landmarks: {
                        leftEye: { x: leftEyeCenter.x, y: leftEyeCenter.y },
                        rightEye: { x: rightEyeCenter.x, y: rightEyeCenter.y },
                        nose: { x: noseTip.x, y: noseTip.y },
                    },
                },
            };
            this.sampleBuffer.push(sample);
        }
    }

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

        const smileLeft =
            blendshapes.find((c: any) => c.categoryName === 'mouthSmileLeft')?.score || 0;
        const smileRight =
            blendshapes.find((c: any) => c.categoryName === 'mouthSmileRight')?.score || 0;
        const browInnerUp =
            blendshapes.find((c: any) => c.categoryName === 'browInnerUp')?.score || 0;
        const browOuterUpLeft =
            blendshapes.find((c: any) => c.categoryName === 'browOuterUpLeft')?.score || 0;
        const browOuterUpRight =
            blendshapes.find((c: any) => c.categoryName === 'browOuterUpRight')?.score || 0;
        const eyeLookOutLeft =
            blendshapes.find((c: any) => c.categoryName === 'eyeLookOutLeft')?.score || 0;
        const eyeLookOutRight =
            blendshapes.find((c: any) => c.categoryName === 'eyeLookOutRight')?.score || 0;
        const mouthOpen = blendshapes.find((c: any) => c.categoryName === 'jawOpen')?.score || 0;
        const eyeWideLeft = blendshapes.find((c: any) => c.categoryName === 'eyeWideLeft')?.score || 0;
        const eyeWideRight = blendshapes.find((c: any) => c.categoryName === 'eyeWideRight')?.score || 0;

        metrics.smile = (smileLeft + smileRight) / 2;
        // 자신감: 과도한 놀람/긴장(eyeWide, browInnerUp↑)은 감점, 적당한 미소와 시선 고정은 가점
        // browOuterUp(약간의 개방감)도 소폭 가점
        const surprise = (eyeWideLeft + eyeWideRight + browInnerUp) / 3;
        metrics.confidence =
            0.45 * metrics.smile +
            0.35 * Math.max(0, 1 - surprise) +
            0.2 * ((browOuterUpLeft + browOuterUpRight) / 2);

        const browDownLeft =
            blendshapes.find((c: any) => c.categoryName === 'browDownLeft')?.score || 0;
        const browDownRight =
            blendshapes.find((c: any) => c.categoryName === 'browDownRight')?.score || 0;
        const mouthPressLeft =
            blendshapes.find((c: any) => c.categoryName === 'mouthPressLeft')?.score || 0;
        const mouthPressRight =
            blendshapes.find((c: any) => c.categoryName === 'mouthPressRight')?.score || 0;

        // 스트레스: 찡그림/입 꽉 다물기 + 눈 크게 뜸을 종합
        metrics.stress =
            (browDownLeft +
                browDownRight +
                mouthPressLeft +
                mouthPressRight +
                eyeWideLeft +
                eyeWideRight) /
            6;
        metrics.nervousness = metrics.stress;

        const eyeBlinkLeft =
            blendshapes.find((c: any) => c.categoryName === 'eyeBlinkLeft')?.score || 0;
        const eyeBlinkRight =
            blendshapes.find((c: any) => c.categoryName === 'eyeBlinkRight')?.score || 0;
        const eyeLookDownLeft =
            blendshapes.find((c: any) => c.categoryName === 'eyeLookDownLeft')?.score || 0;
        const eyeLookDownRight =
            blendshapes.find((c: any) => c.categoryName === 'eyeLookDownRight')?.score || 0;

        const blink = (eyeBlinkLeft + eyeBlinkRight) / 2;
        const gazeAway =
            (eyeLookDownLeft + eyeLookDownRight + eyeLookOutLeft + eyeLookOutRight) / 4;
        metrics.eyeContact = Math.max(0, 1 - gazeAway);
        metrics.attention = Math.max(0, Math.min(1, 0.6 * metrics.eyeContact + 0.4 * (1 - blink)));
        // 외부에서 사용 가능하도록 마지막 blink를 보관
        (this as any)._lastBlinkProb = blink;

        const cheekPuff = blendshapes.find((c: any) => c.categoryName === 'cheekPuff')?.score || 0;
        // 참여도: 시선/집중 + 적당한 미소 + 발화(입열림) 신호
        metrics.engagement = (metrics.attention + metrics.smile + mouthOpen) / 3;
        metrics.composure = 1 - metrics.stress;

        return metrics;
    }

    private generateInterviewFeedback(metrics: any, leftEye: any, rightEye: any, nose: any) {
        const landmarks = {
            leftEye: { x: leftEye.x, y: leftEye.y },
            rightEye: { x: rightEye.x, y: rightEye.y },
            nose: { x: nose.x, y: nose.y },
        };

        const now = Date.now();
        const emit = (type: DetectionResult['type'], payload: DetectionResult) => {
            if (this.lastFeedbackType === type && now - this.lastFeedbackTime < this.feedbackCooldownMs) {
                return; // 동일 유형 메시지 스팸 방지
            }
            this.lastFeedbackType = type;
            this.lastFeedbackTime = now;
            this.onDetection(payload);
        };

        const confWarnTh = this.calib?.confWarnThreshold ?? 0.3;
        const confGoodTh = this.calib?.confGoodThreshold ?? 0.65;
        const attWarnTh = this.calib?.attentionWarnThreshold ?? 0.45;
        const stressWarnTh = this.calib?.stressWarnThreshold ?? 0.6;

        // 1) 스트레스 높음
        if (metrics.stress > stressWarnTh) {
            emit('stress', {
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
            return;
        }

        // 2) 주의/아이컨택 낮음
        if (metrics.attention < attWarnTh || metrics.eyeContact < attWarnTh) {
            emit('attention', {
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
            return;
        }

        // 3) 자신감 낮음
        if (metrics.confidence < confWarnTh) {
            emit('confidence', {
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
            return;
        }

        // 4) 긍정 피드백
        if (metrics.confidence > confGoodTh) {
            emit('confidence', {
                type: 'confidence',
                message: '자신감 있는 표정이 인상적입니다!',
                level: 'excellent',
                confidence: metrics.confidence,
                landmarks,
                metrics: {
                    confidenceScore: metrics.confidence,
                    smileIntensity: metrics.smile,
                    overallPresence: 'good',
                },
            });
            return;
        }

        if (metrics.attention > 0.8 && metrics.eyeContact > 0.7) {
            emit('attention', {
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
            emit('smile', {
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

    private analyzeFrame() {
        if (!this.isAnalyzing || !this.videoRef.current || !this.canvasRef.current) {
            return;
        }

        const video = this.videoRef.current;
        const canvas = this.canvasRef.current;

        if (video.readyState !== 4 || !this.faceLandmarker) {
            if ('requestVideoFrameCallback' in video) {
                (video as any).requestVideoFrameCallback(() => this.analyzeFrame());
            } else {
                this.animationFrameId = requestAnimationFrame(() => this.analyzeFrame());
            }
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const currentTime = Date.now();
        if (!this.hasLoggedInitialData) {
            this.logWebcamData(video, canvas);
            this.hasLoggedInitialData = true;
            this.lastLogTime = currentTime;
        }

        const timeSinceLastAnalysis = currentTime - this.lastAnalysisTime;
        if (timeSinceLastAnalysis < this.analysisInterval) {
            if ('requestVideoFrameCallback' in video) {
                (video as any).requestVideoFrameCallback(() => this.analyzeFrame());
            } else {
                this.animationFrameId = requestAnimationFrame(() => this.analyzeFrame());
            }
            return;
        }

        try {
            const results = this.faceLandmarker.detectForVideo(video, currentTime);
            if (results) {
                this.lastFaceResults = results;
                this.lastDetectionTime = currentTime;
                this.lastAnalysisTime = currentTime;
                this.analyzeFaceResults(results);
            }
        } catch (error) {
            console.error('❌ Face Landmarker 감지 오류:', error);
        }

        if ('requestVideoFrameCallback' in video) {
            (video as any).requestVideoFrameCallback(() => this.analyzeFrame());
        } else {
            this.animationFrameId = requestAnimationFrame(() => this.analyzeFrame());
        }
    }

    private logWebcamData(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
        const stream = video.srcObject as MediaStream;
        const tracks = stream?.getTracks() || [];
        console.log('📊 MediaPipe Tasks Vision 웹캠 데이터 (최초 1회):', {
            timestamp: new Date().toISOString(),
            videoInfo: {
                width: video.videoWidth,
                height: video.videoHeight,
                readyState: video.readyState,
            },
            canvasInfo: { width: canvas.width, height: canvas.height },
            streamInfo: {
                id: stream?.id,
                active: stream?.active,
                tracksCount: tracks.length,
                tracks: tracks.map((t) => ({
                    kind: t.kind,
                    label: t.label,
                    readyState: t.readyState,
                })),
            },
        });
    }

    public async startAnalysis() {
        if (this.isAnalyzing) return;
        try {
            await this.initializeModels();
            await new Promise((r) => setTimeout(r, 300));
            this.isAnalyzing = true;
            this.lastDetectionTime = Date.now();
            this.lastAnalysisTime = Date.now();
            // 분석 루프 시작(캘리브레이션과는 별개)
            // console.debug('MediaPipe 분석 루프 시작 (5초 간격)');
            this.analyzeFrame();
        } catch (error) {
            console.error('❌ MediaPipe Tasks Vision 분석 시작 실패:', error);
            throw error;
        }
    }

    public stopAnalysis() {
        this.isAnalyzing = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log('⏹️ MediaPipe Tasks Vision 분석 중지');
    }

    public dispose() {
        console.log('🧹 MediaPipe Tasks Vision 리소스 정리 시작...');
        this.stopAnalysis();
        if (this.faceLandmarker) {
            this.faceLandmarker.close();
            this.faceLandmarker = null;
        }
        this.vision = null;
        this.isInitialized = false;
        console.log('✅ MediaPipe Tasks Vision 리소스 정리 완료');
    }

    // ===========================================
    // 집계 로직 (버퍼 → 서버 전송용 페이로드 변환)
    // ===========================================
    private computeAggregate(samples: VisualSampleLite[]): VisualAggregatePayload {
        const n = samples.length;

        const toNumArr = (pick: (s: VisualSampleLite) => number | undefined) =>
            samples
                .map(pick)
                .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

        const mean = (arr: number[]) =>
            arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
        const maxv = (arr: number[]) => (arr.length ? Math.max(...arr) : null);
        const std = (arr: number[]) => {
            if (arr.length === 0) return null;
            const m = mean(arr)!;
            const v = arr.reduce((a, x) => a + (x - m) * (x - m), 0) / arr.length;
            return Math.sqrt(v);
        };

        const confs = toNumArr((s) => s.detection.confidenceScore);
        const smiles = toNumArr((s) => s.detection.smileIntensity);
        const eyeContacts = toNumArr((s) => s.detection.eyeContact);
        const blinks = toNumArr((s) => s.detection.blinkProb);

        const presence = { good: 0, average: 0, needs_improvement: 0 };
        const level = { ok: 0, info: 0, warning: 0, critical: 0 as 0 };

        for (const s of samples) {
            const p = s.detection.overallPresence;
            if (p) presence[p]++;
            const l = s.detection.level;
            if (l) (level as any)[l]++;
        }

        const avgPt = (pick: (s: VisualSampleLite) => { x?: number; y?: number } | undefined) => {
            const xs: number[] = [];
            const ys: number[] = [];
            for (const s of samples) {
                const pt = pick(s);
                if (pt?.x != null && Number.isFinite(pt.x)) xs.push(pt.x);
                if (pt?.y != null && Number.isFinite(pt.y)) ys.push(pt.y);
            }
            if (!xs.length || !ys.length) return { x: null, y: null };
            return {
                x: xs.reduce((a, b) => a + b, 0) / xs.length,
                y: ys.reduce((a, b) => a + b, 0) / ys.length,
            };
        };

        const left = avgPt((s) => s.detection.landmarks.leftEye);
        const right = avgPt((s) => s.detection.landmarks.rightEye);
        const nose = avgPt((s) => s.detection.landmarks.nose);

        // 시선 안정성: 코 포인트의 좌표 변동 표준편차 기반 (작을수록 안정)
        const noseXs = toNumArr((s) => s.detection.landmarks.nose?.x);
        const noseYs = toNumArr((s) => s.detection.landmarks.nose?.y);
        const sx = std(noseXs) ?? 0;
        const sy = std(noseYs) ?? 0;
        const motion = Math.sqrt(sx * sx + sy * sy);
        // 0~0.02 구간을 1~0으로 스케일 (영상 좌표 기준 경험값)
        const gazeStability = Math.max(0, Math.min(1, 1 - motion / 0.02));

        const ts = samples
            .map((s) => Date.parse(s.timestamp))
            .filter((v) => Number.isFinite(v)) as number[];

        return {
            sample_count: n,

            confidence_mean: mean(confs),
            confidence_max: maxv(confs),
            smile_mean: mean(smiles),
            smile_max: maxv(smiles),

            eye_contact_mean: mean(eyeContacts),
            blink_mean: mean(blinks),
            gaze_stability: Number.isFinite(gazeStability) ? gazeStability : null,

            presence_good: presence.good,
            presence_average: presence.average,
            presence_needs_improvement: presence.needs_improvement,

            level_ok: level.ok,
            level_info: level.info,
            level_warning: level.warning,
            level_critical: level.critical,

            left_eye_x_mean: left.x,
            left_eye_y_mean: left.y,
            right_eye_x_mean: right.x,
            right_eye_y_mean: right.y,
            nose_x_mean: nose.x,
            nose_y_mean: nose.y,

            started_at_ms: ts.length ? Math.min(...ts) : (this.questionStartedAt ?? null),
            ended_at_ms: ts.length ? Math.max(...ts) : this.questionStartedAt ? Date.now() : null,
        };
    }
}
