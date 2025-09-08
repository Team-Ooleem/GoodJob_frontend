'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Typography, Button, Space, Row, Col, Progress, Statistic, Alert } from 'antd';
import {
    AudioOutlined,
    VideoCameraOutlined,
    PlayCircleOutlined,
    StopOutlined,
    SaveOutlined,
    ArrowRightOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import axios from 'axios';

import { Webcam, WebcamHandle } from '../_components/Webcam';
import { VisualAggregatePayload } from '../_components/RealMediaPipeAnalyzer';

const { Title, Paragraph, Text } = Typography;

// 간단 WAV 레코더 (세션 페이지와 동일한 기본 구조, 레벨 콜백 추가)
class WavRecorder {
    private audioCtx: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private buffers: Float32Array[] = [];
    private recording = false;
    private stopped = false;
    constructor(private onLevel?: (levelPct: number) => void) {}

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
            if (this.onLevel) {
                // 간단 RMS 레벨 측정 (0~100%)
                let sum = 0;
                for (let i = 0; i < ch0.length; i++) sum += ch0[i] * ch0[i];
                const rms = Math.sqrt(sum / ch0.length);
                const pct = Math.min(1, rms * 4) * 100; // 대략적인 스케일
                this.onLevel(Math.round(pct));
            }
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

// 서버 오디오 피처 API
const AUDIO_API_BASE = process.env.NEXT_PUBLIC_AUDIO_API_BASE; // 예: http://localhost:8081
async function analyzeAudioBlob(blob: Blob) {
    if (!AUDIO_API_BASE) return null; // 서버가 없으면 생략
    const form = new FormData();
    form.append('file', blob, 'calibration.wav');
    const res = await axios.post(`${AUDIO_API_BASE}/audio/analyze`, form, { timeout: 60000 });
    return res.data?.features ?? null;
}

export default function CalibrationPage() {
    const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
    const [timeLeft, setTimeLeft] = useState(15);
    const [micLevel, setMicLevel] = useState(0);
    const [audioFeatures, setAudioFeatures] = useState<any | null>(null);
    const [visualAgg, setVisualAgg] = useState<VisualAggregatePayload | null>(null);
    const [error, setError] = useState<string | null>(null);
    const webcamRef = useRef<WebcamHandle>(null);
    const recRef = useRef<WavRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const CALI_TEXT =
        '다음 문장을 자연스럽게 읽어주세요. 저는 충분한 발성과 정확한 발음을 위해 또렷하게 말하겠습니다. 면접관을 바라보며 차분한 표정과 안정적인 호흡을 유지하겠습니다.';

    useEffect(() => {
        if (phase !== 'running') return;
        timerRef.current && clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current!);
                    void finishCalibration();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    const startCalibration = async () => {
        try {
            setError(null);
            setAudioFeatures(null);
            setVisualAgg(null);
            setTimeLeft(15);
            setPhase('running');

            // 비디오 수집 시작
            webcamRef.current?.startQuestion('calibration', { text: 'Calibration' });

            // 오디오 레코딩 시작(레벨 콜백 포함)
            recRef.current = new WavRecorder((level) => setMicLevel(level));
            await recRef.current.start();
        } catch (e: any) {
            setPhase('idle');
            setError(e?.message || '캘리브레이션 시작 실패');
        }
    };

    const stopCalibration = async () => {
        if (phase !== 'running') return;
        if (timerRef.current) clearInterval(timerRef.current);
        await finishCalibration();
    };

    const finishCalibration = async () => {
        try {
            // 비디오 집계
            const vAgg = webcamRef.current?.endQuestion() ?? null;
            if (vAgg) setVisualAgg(vAgg);

            // 오디오 분석
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

            // 로컬 저장
            const payload = {
                createdAt: new Date().toISOString(),
                audio: feats,
                visual: vAgg,
            };
            localStorage.setItem('aiInterviewCalibration', JSON.stringify(payload));

            setPhase('done');
        } catch (e: any) {
            setError(e?.message || '캘리브레이션 종료 처리 실패');
            setPhase('idle');
        }
    };

    const saveAndGo = () => {
        // 이미 finish에서 저장함. 바로 이동
        window.location.href = '/ai-interview/sessions';
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
            <div className='container mx-auto px-4'>
                <div className='text-center mb-8'>
                    <Title level={1} className='!text-4xl !font-bold !text-gray-800 mb-2'>
                        캘리브레이션
                    </Title>
                    <Paragraph className='!text-lg !text-gray-600 max-w-2xl mx-auto'>
                        환경과 사용자 기준점을 먼저 측정합니다. 아래 문장을 15초 동안 또박또박
                        읽어주세요.
                    </Paragraph>
                </div>

                {error && (
                    <div className='max-w-3xl mx-auto mb-6'>
                        <Alert type='error' showIcon message='오류' description={error} />
                    </div>
                )}

                <div className='max-w-2xl mx-auto'>
                    <Card className='!border-0 !shadow-lg !rounded-3xl'>
                        <div className='text-center mb-4'>
                            <Title level={2} className='!m-0 !text-gray-800'>
                                얼굴을 가이드 선 안에 들어오게 맞추고,
                                <br /> 녹화 버튼을 눌러주세요.
                            </Title>
                            <Paragraph className='!mt-2 !text-gray-500'>
                                녹화가 시작되면 아래 문장을 소리 내서 읽어주세요.
                            </Paragraph>
                        </div>

                        <div className='flex flex-col items-center'>
                            <div
                                className='rounded-3xl overflow-hidden shadow-md relative'
                                style={{ width: 720, height: 405, background: '#e5e7eb' }}
                            >
                                <Webcam ref={webcamRef} width={720} height={405} overlayGuide />
                            </div>
                            <div className='w-[720px] bg-white rounded-b-3xl shadow-sm flex items-center justify-center py-6 -mt-1'>
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
                                        className='w-16 h-16 rounded-full bg-red-500 shadow-md flex items-center justify-center hover:scale-105 transition'
                                        aria-label='중지 및 결과 산출'
                                    >
                                        <span className='w-3 h-3 rounded-full bg-white block animate-pulse'></span>
                                    </button>
                                )}
                            </div>

                            {/* 진행률/타이머 */}
                            <div className='w-full mt-6 mb-4'>
                                {phase !== 'idle' && (
                                    <Progress
                                        percent={((15 - timeLeft) / 15) * 100}
                                        showInfo={false}
                                    />
                                )}
                                {phase === 'running' && (
                                    <div className='text-center text-gray-600 mt-2'>
                                        남은 시간 {timeLeft}s
                                    </div>
                                )}
                            </div>

                            {/* 캘리브레이션 문장 */}
                            <blockquote className='text-2xl text-green-500/80 italic text-center px-6 py-4 border rounded-2xl bg-green-50/40'>
                                “나는 어려움을 이겨내며 성장한다.”
                            </blockquote>
                            {/* 실시간 레벨 바 (영상 중앙 버튼 아래로 이동) */}
                            <div className='w-full max-w-md mt-4'>
                                <div className='w-full h-3 bg-gray-200 rounded-full overflow-hidden'>
                                    <div
                                        className={`h-3 rounded-full transition-all duration-100 ${
                                            micLevel > 70
                                                ? 'bg-red-500'
                                                : micLevel > 40
                                                  ? 'bg-yellow-500'
                                                  : 'bg-green-500'
                                        }`}
                                        style={{ width: `${micLevel}%` }}
                                    ></div>
                                </div>
                                <div className='text-center text-xs text-gray-500 mt-1'>
                                    실시간 마이크 레벨: {micLevel}%
                                </div>
                            </div>

                            {/* 완료/이동 액션 */}
                            <div className='mt-6 flex gap-3'>
                                <Link href='/ai-interview/setting'>
                                    <Button icon={<InfoCircleOutlined />}>
                                        장치 설정으로 돌아가기
                                    </Button>
                                </Link>
                                <Button
                                    type='primary'
                                    icon={<SaveOutlined />}
                                    disabled={phase !== 'done'}
                                    onClick={saveAndGo}
                                >
                                    적용하고 세션으로 진행
                                </Button>
                                <Link href='/ai-interview/sessions'>
                                    <Button
                                        icon={<ArrowRightOutlined />}
                                        disabled={phase === 'running'}
                                    >
                                        바로 세션으로 이동
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
