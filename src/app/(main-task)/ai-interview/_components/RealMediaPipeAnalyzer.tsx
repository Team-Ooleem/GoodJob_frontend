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
    private analysisInterval = 5000; // 5초마다 분석 실행
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

    // ===========================
    // Public: 문항 시작/종료 API
    // ===========================
    public startQuestion(questionId: string, opts?: { orderNo?: number; text?: string }) {
        this.currentQuestionId = questionId;
        this.currentOrderNo = opts?.orderNo;
        this.currentQuestionText = opts?.text;
        this.sampleBuffer = [];
        this.questionStartedAt = Date.now();
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
        } catch (error) {
            console.error('❌ MediaPipe Tasks Vision 모델 초기화 실패:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    private analyzeFaceResults(results: any) {
        const currentTime = Date.now();

        // 10초마다 요약 로그
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

        if (!results.faceLandmarks || results.faceLandmarks.length === 0) return;

        const faceLandmarks = results.faceLandmarks[0];
        const faceBlendshapes = results.faceBlendshapes?.[0];

        const leftEyeCenter = faceLandmarks[159];
        const rightEyeCenter = faceLandmarks[386];
        const noseTip = faceLandmarks[1];

        const interviewMetrics = this.calculateInterviewMetrics(faceBlendshapes, faceLandmarks);

        // ▼ 실시간 피드백 (기존 유지)
        this.generateInterviewFeedback(interviewMetrics, leftEyeCenter, rightEyeCenter, noseTip);

        // ▼ 추가: 5초 간격 분석시 **버퍼에 샘플 기록** (문항 진행중일 때만)
        if (this.currentQuestionId) {
            const presence: Presence =
                interviewMetrics.confidence > 0.7
                    ? 'good'
                    : interviewMetrics.confidence < 0.4
                      ? 'needs_improvement'
                      : 'average';

            // level 매핑: warning만 경고, 나머지는 ok로 단순화(원하면 더 정교화 가능)
            const level: LevelAgg = interviewMetrics.stress > 0.6 ? 'warning' : 'ok';

            const sample: VisualSampleLite = {
                timestamp: new Date().toISOString(),
                detection: {
                    confidenceScore: interviewMetrics.confidence,
                    smileIntensity: interviewMetrics.smile,
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

        metrics.smile = (smileLeft + smileRight) / 2;
        metrics.confidence =
            metrics.smile * 0.4 +
            (browOuterUpLeft + browOuterUpRight) * 0.3 +
            (1 - browInnerUp) * 0.3;

        const browDownLeft =
            blendshapes.find((c: any) => c.categoryName === 'browDownLeft')?.score || 0;
        const browDownRight =
            blendshapes.find((c: any) => c.categoryName === 'browDownRight')?.score || 0;
        const mouthPressLeft =
            blendshapes.find((c: any) => c.categoryName === 'mouthPressLeft')?.score || 0;
        const mouthPressRight =
            blendshapes.find((c: any) => c.categoryName === 'mouthPressRight')?.score || 0;

        metrics.stress = (browDownLeft + browDownRight + mouthPressLeft + mouthPressRight) / 4;
        metrics.nervousness = metrics.stress;

        const eyeBlinkLeft =
            blendshapes.find((c: any) => c.categoryName === 'eyeBlinkLeft')?.score || 0;
        const eyeBlinkRight =
            blendshapes.find((c: any) => c.categoryName === 'eyeBlinkRight')?.score || 0;
        const eyeLookDownLeft =
            blendshapes.find((c: any) => c.categoryName === 'eyeLookDownLeft')?.score || 0;
        const eyeLookDownRight =
            blendshapes.find((c: any) => c.categoryName === 'eyeLookDownRight')?.score || 0;

        metrics.attention = 1 - (eyeBlinkLeft + eyeBlinkRight) / 2;
        metrics.eyeContact = 1 - (eyeLookDownLeft + eyeLookDownRight) / 2;

        const cheekPuff = blendshapes.find((c: any) => c.categoryName === 'cheekPuff')?.score || 0;
        metrics.engagement = (metrics.smile + metrics.attention + (1 - cheekPuff)) / 3;
        metrics.composure = 1 - metrics.stress;

        return metrics;
    }

    private generateInterviewFeedback(metrics: any, leftEye: any, rightEye: any, nose: any) {
        const landmarks = {
            leftEye: { x: leftEye.x, y: leftEye.y },
            rightEye: { x: rightEye.x, y: rightEye.y },
            nose: { x: nose.x, y: nose.y },
        };

        // 1) 스트레스 높음
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
            return;
        }

        // 2) 주의/아이컨택 낮음
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
            return;
        }

        // 3) 자신감 낮음
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
            return;
        }

        // 4) 긍정 피드백
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
                    overallPresence: 'good',
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
            console.log('🎯 MediaPipe Tasks Vision 분석 시작 (5초 간격)');
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

        const confs = toNumArr((s) => s.detection.confidenceScore);
        const smiles = toNumArr((s) => s.detection.smileIntensity);

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

        const ts = samples
            .map((s) => Date.parse(s.timestamp))
            .filter((v) => Number.isFinite(v)) as number[];

        return {
            sample_count: n,

            confidence_mean: mean(confs),
            confidence_max: maxv(confs),
            smile_mean: mean(smiles),
            smile_max: maxv(smiles),

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
