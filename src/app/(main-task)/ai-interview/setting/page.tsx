'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Video, Mic } from 'lucide-react';
import { api } from '@/apis/api';

import { Webcam, WebcamHandle } from '../_components/Webcam';
import { VisualAggregatePayload } from '../_components/RealMediaPipeAnalyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 간단 WAV 레코더
class WavRecorder {
    private audioCtx: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private buffers: Float32Array[] = [];
    private recording = false;
    private stopped = false;

    async start() {
        if (this.recording) return;
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.source = this.audioCtx.createMediaStreamSource(this.stream);
        this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
        this.source.connect(this.processor);
        this.processor.connect(this.audioCtx.destination);
        this.buffers = [];
        this.recording = true;
        this.stopped = false;
        this.processor.onaudioprocess = (e) => {
            if (!this.recording) return;
            const ch0 = e.inputBuffer.getChannelData(0);
            this.buffers.push(new Float32Array(ch0));
        };
    }

    async stop(): Promise<Blob> {
        if (this.stopped) {
            return this.encodeWAV(new Float32Array(0), this.audioCtx?.sampleRate || 44100);
        }
        this.stopped = true;
        this.recording = false;
        try {
            if (this.processor) this.processor.onaudioprocess = null;
        } catch {}
        try {
            if (this.processor) this.processor.disconnect();
        } catch {}
        try {
            if (this.source) this.source.disconnect();
        } catch {}
        try {
            if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
        } catch {}
        const sr = this.audioCtx?.sampleRate || 44100;
        const samples = this.merge(this.buffers);
        const wav = this.encodeWAV(samples, sr);
        try {
            if (this.audioCtx && this.audioCtx.state !== 'closed') await this.audioCtx.close();
        } catch {}
        this.audioCtx = null;
        this.stream = null;
        this.source = null;
        this.processor = null;
        this.buffers = [];
        return wav;
    }

    private merge(chunks: Float32Array[]) {
        const total = chunks.reduce((a, b) => a + b.length, 0);
        const out = new Float32Array(total);
        let off = 0;
        for (const c of chunks) {
            out.set(c, off);
            off += c.length;
        }
        return out;
    }

    private encodeWAV(samples: Float32Array, sampleRate: number) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeString = (off: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
        };
        const floatTo16 = (off: number, input: Float32Array) => {
            for (let i = 0; i < input.length; i++, off += 2) {
                let s = Math.max(-1, Math.min(1, input[i]));
                s = s < 0 ? s * 0x8000 : s * 0x7fff;
                view.setInt16(off, s, true);
            }
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        floatTo16(44, samples);
        return new Blob([view], { type: 'audio/wav' });
    }
}

export default function AiInterviewSettingCalibrationCombined() {
    const webcamRef = useRef<WebcamHandle>(null);
    const recRef = useRef<WavRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
    const [timeLeft, setTimeLeft] = useState(15);
    const [error, setError] = useState<string | null>(null);
    const [visualAgg, setVisualAgg] = useState<VisualAggregatePayload | null>(null);
    const [audioFeatures, setAudioFeatures] = useState<any | null>(null);
    const [webcamOk, setWebcamOk] = useState(false);
    const [micOk, setMicOk] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const CALI_TEXT = '너무 맑고 초롱한 그 중 하나 별이여';

    useEffect(() => {
        if (phase !== 'running') return;
        timerRef.current && clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current!);
                    // 시간 초과 → 결과는 버리고 다시 시도 요청
                    (async () => {
                        try {
                            if (recRef.current) await recRef.current.stop();
                        } catch {}
                        try {
                            // 비디오 버퍼 클리어만 수행(결과 사용 안 함)
                            webcamRef.current?.endQuestion();
                        } catch {}
                        setPhase('idle');
                        setTimeLeft(15);
                    })();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [phase]);

    // 장치 존재 체크 + 기존 세션 ID 로드
    useEffect(() => {
        (async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setWebcamOk(devices.some((d) => d.kind === 'videoinput'));
                setMicOk(devices.some((d) => d.kind === 'audioinput'));
            } catch (e) {
                setWebcamOk(false);
                setMicOk(false);
            }
            // Select 페이지에서 생성된 세션 ID를 로드
            try {
                const sid = localStorage.getItem('aiInterviewSessionId');
                if (sid) setSessionId(sid);
                else console.warn('세션 ID가 없습니다. 선택 페이지에서 세션을 생성하세요.');
            } catch (e) {
                console.warn('세션 ID 로드 실패:', e);
            }
        })();
    }, []);

    const startCalibration: () => Promise<void> = async () => {
        try {
            setError(null);
            setVisualAgg(null);
            setAudioFeatures(null);
            setTimeLeft(15);
            setPhase('running');
            webcamRef.current?.startQuestion('calibration', { text: 'Calibration' });
            recRef.current = new WavRecorder();
            await recRef.current.start();
        } catch (e: any) {
            setPhase('idle');
            setError(e?.message || '모의면접 준비 실패');
        }
    };

    const stopCalibration: () => Promise<void> = async () => {
        if (phase !== 'running') return;
        if (timerRef.current) clearInterval(timerRef.current);
        try {
            setIsProcessing(true);
            await finishCalibration();
        } finally {
            setIsProcessing(false);
        }
    };

    const finishCalibration: () => Promise<void> = async () => {
        try {
            const startTime = Date.now();

            // 영상 집계 데이터 수집
            const vAgg = webcamRef.current?.endQuestion() ?? null;
            if (vAgg) setVisualAgg(vAgg);

            // 음성 데이터 수집
            let audioBlob: Blob | null = null;
            if (recRef.current) {
                audioBlob = await recRef.current.stop();
            }

            const endTime = Date.now();
            const durationMs = endTime - startTime;

            // 백엔드로 캘리브레이션 데이터 전송
            if (audioBlob || vAgg) {
                const formData = new FormData();

                if (audioBlob) {
                    formData.append('file', audioBlob, 'calibration.wav');
                }

                if (vAgg) {
                    formData.append('visualData', JSON.stringify(vAgg));
                }

                formData.append('durationMs', durationMs.toString());

                if (!sessionId)
                    throw new Error(
                        '세션 ID가 준비되지 않았습니다. 새로고침 후 다시 시도해주세요.',
                    );
                const response = await api.post(`calibration/${sessionId}/combined`, formData, {
                    timeout: 60000,
                });

                if (response.data?.ok) {
                    setAudioFeatures(response.data.audioFeatures);

                    // 로컬 저장소에도 저장 (호환성)
                    localStorage.setItem(
                        'aiInterviewCalibration',
                        JSON.stringify({
                            createdAt: new Date().toISOString(),
                            sessionId,
                            audio: response.data.audioFeatures,
                            visual: vAgg,
                        }),
                    );

                    // 별도 calibrationSessionId 저장 불필요: aiInterviewSessionId를 그대로 사용
                }
            }

            setPhase('done');
        } catch (e: any) {
            console.error('캘리브레이션 저장 실패:', e);
            setError(e?.response?.data?.message || e?.message || '환경설정 실패');
            setPhase('idle');
        }
    };

    const resetCalibration: () => void = () => {
        setError(null);
        setVisualAgg(null);
        setAudioFeatures(null);
        setPhase('idle');
        setTimeLeft(15);
    };

    const goToSession: () => void = () => {
        // 캘리브레이션이 완료된 상태에서만 면접 시작 가능
        if (phase === 'done') {
            window.location.href = '/ai-interview/sessions';
        }
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-3 relative overflow-hidden'>
            {/* 화면 하단 초록색 마이크 애니메이션 */}
            <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full'>
                <div className='w-full h-16 bg-green-400/20 rounded-full blur-3xl animate-pulse translate-y-1'></div>
                <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[256px] h-[8px] bg-green-300 rounded-full'></div>
            </div>

            <Card className='w-full max-w-3xl shadow-xl border-0 rounded-xl overflow-hidden relative z-10'>
                <CardHeader className='px-6 pt-6 pb-4 text-center'>
                    <div className='flex items-center justify-center mb-3'>
                        <div className='w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center mr-3'>
                            <Video className='text-white text-lg' />
                        </div>
                        <CardTitle className='text-2xl font-bold text-gray-900 mb-0'>
                            AI 모의면접 환경 설정
                        </CardTitle>
                    </div>
                    <p className='text-gray-600 text-base'>
                        최적의 면접 환경을 위해 카메라와 마이크를 테스트해주세요.
                    </p>
                </CardHeader>

                {error && (
                    <div className='px-6 mb-4'>
                        <div className='bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg flex items-center'>
                            <div className='w-3 h-3 bg-red-500 rounded-full mr-2'></div>
                            <div>
                                <div className='font-semibold text-sm'>오류</div>
                                <div className='text-xs'>{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <CardContent className='px-6 pb-6'>
                    <div className='flex flex-col items-center'>
                        {/* Video Container */}
                        <div className='relative mb-4'>
                            <div
                                className='rounded-2xl overflow-hidden shadow-md relative'
                                style={{ width: 600, height: 338, background: '#e5e7eb' }}
                            >
                                <Webcam ref={webcamRef} width={600} height={338} overlayGuide />
                            </div>
                            {/* 버튼을 영상 아래의 흰색 베이스 위에 배치 */}
                            <div className='w-[600px] bg-white rounded-b-2xl shadow-sm flex flex-col items-center justify-center gap-3 py-4 -mt-1'>
                                <div className='flex items-center gap-3'>
                                    {phase !== 'running' ? (
                                        <button
                                            onClick={startCalibration}
                                            className='w-14 h-14 rounded-full bg-white shadow-lg border-2 border-red-200 flex items-center justify-center hover:scale-110 hover:shadow-xl transition-all duration-300'
                                            style={{
                                                animation:
                                                    'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                            }}
                                            aria-label='기준 측정 시작'
                                        >
                                            <span
                                                className='w-6 h-6 rounded-full bg-red-500 block'
                                                style={{
                                                    animation:
                                                        'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                                }}
                                            ></span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopCalibration}
                                            disabled={isProcessing}
                                            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all duration-300 ${isProcessing ? 'bg-red-300' : 'bg-red-500'}`}
                                            aria-label='중지 및 결과 산출'
                                        >
                                            <span className='w-3 h-3 rounded-full bg-white block animate-pulse'></span>
                                        </button>
                                    )}
                                    {phase === 'done' && (
                                        <Button
                                            onClick={resetCalibration}
                                            size='sm'
                                            disabled={isProcessing}
                                            className='text-xs px-3 py-1 h-8'
                                        >
                                            다시 녹음하기
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* 캘리브레이션 문장 */}
                            <div className='mt-4'>
                                <blockquote className='text-xl text-sky-500/80 italic text-center px-5 py-3 border rounded-xl bg-sky-50/40'>
                                    "{CALI_TEXT}"
                                </blockquote>
                            </div>

                            {/* 최종 버튼 */}
                            <div className='mt-6 flex justify-center'>
                                <Button
                                    size='lg'
                                    className='h-12 px-8 text-base font-bold bg-sky-500 hover:bg-sky-600 border-0 rounded-xl shadow-lg text-white'
                                    onClick={goToSession}
                                    disabled={!(webcamOk && micOk && phase === 'done')}
                                >
                                    <ArrowRight className='mr-2 w-4 h-4' />
                                    {phase === 'done'
                                        ? 'AI 모의면접 시작하기'
                                        : '환경 테스트를 완료해주세요'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Audio Visualization - Bottom */}
                    {phase === 'running' && (
                        <div className='px-6 pb-4 relative'>
                            <div className='flex items-center justify-center gap-2'>
                                <Mic className='text-sky-500 text-base animate-pulse' />
                                <span className='text-sm text-gray-600 mr-3'>음성 감지 중</span>
                                {/* Audio Level Visualization */}
                                <div className='flex items-center gap-1 relative'>
                                    {/* Glow effect behind the bars */}
                                    <div className='absolute inset-0 bg-sky-400/20 rounded-full blur-sm animate-pulse'></div>
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1 bg-gradient-to-t from-sky-300 to-sky-500 rounded-full animate-pulse relative z-10 shadow-lg shadow-sky-400/50`}
                                            style={{
                                                height: `${Math.random() * 20 + 8}px`,
                                                animationDelay: `${i * 50}ms`,
                                                animationDuration: `${600 + Math.random() * 300}ms`,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
