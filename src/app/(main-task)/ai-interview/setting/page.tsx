'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Video, Mic } from 'lucide-react';
import axios from 'axios';

import { Webcam, WebcamHandle } from '../_components/Webcam';
import { VisualAggregatePayload } from '../_components/RealMediaPipeAnalyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 간단 WAV 레코더 (레벨 콜백은 사용하지 않음)
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

const AUDIO_API_BASE = process.env.NEXT_PUBLIC_AUDIO_API_BASE;
async function analyzeAudioBlob(blob: Blob) {
    if (!AUDIO_API_BASE) return null;
    const form = new FormData();
    form.append('file', blob, 'calibration.wav');
    const res = await axios.post(`${AUDIO_API_BASE}/audio/analyze`, form, { timeout: 60000 });
    return res.data?.features ?? null;
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

    const CALI_TEXT = '나는 핀토스를 부순다.';

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

    // 장치 존재 체크(간단)
    useEffect(() => {
        (async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                setWebcamOk(devices.some((d) => d.kind === 'videoinput'));
                setMicOk(devices.some((d) => d.kind === 'audioinput'));
            } catch (e) {
                // 권한 미부여 등으로 실패 시 버튼 비활성 유지
                setWebcamOk(false);
                setMicOk(false);
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
            const vAgg = webcamRef.current?.endQuestion() ?? null;
            if (vAgg) setVisualAgg(vAgg);
            let feats: any | null = null;
            if (recRef.current) {
                const wav = await recRef.current.stop();
                try {
                    feats = await analyzeAudioBlob(wav);
                } catch (err) {
                    console.warn('오디오 분석 서버 미응답 또는 실패', err);
                }
            }
            setAudioFeatures(feats);
            localStorage.setItem(
                'aiInterviewCalibration',
                JSON.stringify({ createdAt: new Date().toISOString(), audio: feats, visual: vAgg }),
            );
            setPhase('done');
        } catch (e: any) {
            setError(e?.message || '환경설정 실패');
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
        window.location.href = '/ai-interview/sessions';
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 relative overflow-hidden'>
            {/* Voice Activity Glow Effect */}
            <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full'>
                <div className='w-full h-64 bg-green-400/20 rounded-full blur-3xl animate-pulse translate-y-8'></div>
            </div>

            <Card className='w-full max-w-4xl shadow-xl border-0 rounded-2xl overflow-hidden relative z-10'>
                <CardHeader className='px-8 pt-8 pb-6 text-center'>
                    <div className='flex items-center justify-center mb-4'>
                        <div className='w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4'>
                            <Video className='text-white text-xl' />
                        </div>
                        <CardTitle className='text-3xl font-bold text-gray-900 mb-0'>
                            AI 모의면접 환경 설정
                        </CardTitle>
                    </div>
                    <p className='text-gray-600 text-lg'>
                        최적의 면접 환경을 위해 카메라와 마이크를 테스트해주세요.
                    </p>
                </CardHeader>

                {error && (
                    <div className='px-8 mb-6'>
                        <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center'>
                            <div className='w-4 h-4 bg-red-500 rounded-full mr-3'></div>
                            <div>
                                <div className='font-semibold'>오류</div>
                                <div className='text-sm'>{error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <CardContent className='px-8 pb-8'>
                    <div className='flex flex-col items-center'>
                        {/* Video Container */}
                        <div className='relative mb-6'>
                            <div
                                className='rounded-3xl overflow-hidden shadow-md relative'
                                style={{ width: 720, height: 405, background: '#e5e7eb' }}
                            >
                                <Webcam ref={webcamRef} width={720} height={405} overlayGuide />
                            </div>
                            {/* 버튼을 영상 아래의 흰색 베이스 위에 배치 */}
                            <div className='w-[720px] bg-white rounded-b-3xl shadow-sm flex items-center justify-center gap-4 py-6 -mt-1'>
                                {phase !== 'running' ? (
                                    <button
                                        onClick={startCalibration}
                                        className='w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-105 transition'
                                        aria-label='기준 측정 시작'
                                    >
                                        <span className='w-6 h-6 rounded-full bg-red-500 block'></span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopCalibration}
                                        disabled={isProcessing}
                                        className={`w-16 h-16 rounded-full shadow-md flex items-center justify-center hover:scale-105 transition ${isProcessing ? 'bg-red-300' : 'bg-red-500'}`}
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
                                    >
                                        다시 녹음하기
                                    </Button>
                                )}
                            </div>

                            {/* 진행률/타이머 UI 제거 (요청) */}

                            {/* 캘리브레이션 문장 */}
                            <blockquote className='text-2xl text-green-500/80 italic text-center px-6 py-4 border rounded-2xl bg-green-50/40'>
                                "{CALI_TEXT}"
                            </blockquote>

                            {/* 액션들 */}
                            <div className='mt-6 flex gap-3'>
                                <Button
                                    onClick={resetCalibration}
                                    size='lg'
                                    className='h-12 px-6 text-base rounded-xl'
                                    disabled={isProcessing}
                                >
                                    AI 모의면접 시작하기
                                </Button>
                            </div>

                            <Button
                                size='lg'
                                className='h-16 px-12 text-xl font-bold bg-green-600 hover:bg-green-700 border-0 rounded-2xl shadow-lg text-white'
                                onClick={goToSession}
                                disabled={!(webcamOk && micOk && phase === 'done')}
                            >
                                <ArrowRight className='mr-2' />
                                {phase === 'done'
                                    ? 'AI 모의면접 시작하기'
                                    : '환경 테스트를 완료해주세요'}
                            </Button>
                        </div>
                    </div>

                    {/* Audio Visualization - Bottom */}
                    {phase === 'running' && (
                        <div className='px-8 pb-6 relative'>
                            <div className='flex items-center justify-center gap-2'>
                                <Mic className='text-green-500 text-lg animate-pulse' />
                                <span className='text-sm text-gray-600 mr-4'>음성 감지 중</span>
                                {/* Audio Level Visualization */}
                                <div className='flex items-center gap-1 relative'>
                                    {/* Glow effect behind the bars */}
                                    <div className='absolute inset-0 bg-green-400/20 rounded-full blur-md animate-pulse'></div>
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 bg-gradient-to-t from-green-400 to-green-600 rounded-full animate-pulse relative z-10 shadow-lg shadow-green-400/50`}
                                            style={{
                                                height: `${Math.random() * 24 + 10}px`,
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
