<<<<<<< Updated upstream
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, Card, Typography, Space, Row, Col, Alert, Badge, Spin } from 'antd';
import {
    VideoCameraOutlined,
    AudioOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ArrowRightOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

interface DeviceStatus {
    webcam: {
        available: boolean;
        devices: MediaDeviceInfo[];
        error?: string;
        testing: boolean;
    };
    microphone: {
        available: boolean;
        devices: MediaDeviceInfo[];
        error?: string;
        testing: boolean;
    };
}

export default function AiInterviewSettingPage() {
    const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
        webcam: { available: false, devices: [], testing: false },
        microphone: { available: false, devices: [], testing: false },
    });

    const [allTestsPassed, setAllTestsPassed] = useState(false);
    const [micLevel, setMicLevel] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);

    // 웹캠 상태 확인
    const checkWebcam = async () => {
        setDeviceStatus((prev) => ({
            ...prev,
            webcam: { ...prev.webcam, testing: true, error: undefined },
        }));

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter((device) => device.kind === 'videoinput');

            if (videoDevices.length === 0) {
                throw new Error('웹캠이 감지되지 않습니다.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setDeviceStatus((prev) => ({
                ...prev,
                webcam: {
                    available: true,
                    devices: videoDevices,
                    testing: false,
                },
            }));
        } catch (error) {
            setDeviceStatus((prev) => ({
                ...prev,
                webcam: {
                    available: false,
                    devices: [],
                    testing: false,
                    error: error instanceof Error ? error.message : '웹캠 접근에 실패했습니다.',
                },
            }));
        }
    };

    // 마이크 레벨미터 시작
    const startMicLevelMeter = (stream: MediaStream) => {
        try {
            // AudioContext 생성
            audioContextRef.current = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
            const audioContext = audioContextRef.current;

            // 마이크 스트림을 AudioContext에 연결
            const source = audioContext.createMediaStreamSource(stream);
            analyserRef.current = audioContext.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8;

            source.connect(analyserRef.current);

            // 레벨 측정 함수
            const measureLevel = () => {
                if (!analyserRef.current) return;

                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteFrequencyData(dataArray);

                // 평균 레벨 계산
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                const level = Math.round((average / 255) * 100);

                setMicLevel(level);
                requestAnimationFrame(measureLevel);
            };

            measureLevel();
        } catch (error) {
            console.error('마이크 레벨미터 시작 실패:', error);
        }
    };

    // 마이크 레벨미터 정지
    const stopMicLevelMeter = () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((track) => track.stop());
            micStreamRef.current = null;
        }
        analyserRef.current = null;
        setMicLevel(0);
    };

    // 마이크 상태 확인
    const checkMicrophone = async () => {
        setDeviceStatus((prev) => ({
            ...prev,
            microphone: { ...prev.microphone, testing: true, error: undefined },
        }));

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter((device) => device.kind === 'audioinput');

            if (audioDevices.length === 0) {
                throw new Error('마이크가 감지되지 않습니다.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            micStreamRef.current = stream;

            if (audioRef.current) {
                audioRef.current.srcObject = stream;
            }

            // 마이크 레벨미터 시작
            startMicLevelMeter(stream);

            setDeviceStatus((prev) => ({
                ...prev,
                microphone: {
                    available: true,
                    devices: audioDevices,
                    testing: false,
                },
            }));
        } catch (error) {
            let errorMessage = '마이크 접근에 실패했습니다.';

            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    errorMessage =
                        '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage =
                        '마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage =
                        '마이크가 다른 앱에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.';
                } else if (error.name === 'OverconstrainedError') {
                    errorMessage = '마이크 설정에 문제가 있습니다. 다른 마이크를 사용해보세요.';
                } else {
                    errorMessage = error.message;
                }
            }

            setDeviceStatus((prev) => ({
                ...prev,
                microphone: {
                    available: false,
                    devices: [],
                    testing: false,
                    error: errorMessage,
                },
            }));
        }
    };

    // 모든 테스트 실행
    const runAllTests = async () => {
        await Promise.all([checkWebcam(), checkMicrophone()]);
    };

    // 모든 테스트 통과 여부 확인
    useEffect(() => {
        const passed = deviceStatus.webcam.available && deviceStatus.microphone.available;
        setAllTestsPassed(passed);
    }, [deviceStatus]);

    // 컴포넌트 마운트 시 자동 테스트
    useEffect(() => {
        runAllTests();
    }, []);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            stopMicLevelMeter();
        };
    }, []);

    const getStatusIcon = (available: boolean, testing: boolean) => {
        if (testing) return <Spin size='small' />;
        return available ? (
            <CheckCircleOutlined className='text-green-500 text-xl' />
        ) : (
            <CloseCircleOutlined className='text-red-500 text-xl' />
        );
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
            <div className='container mx-auto px-4'>
                {/* Header */}
                <div className='text-center mb-8'>
                    <Title level={1} className='!text-4xl !font-bold !text-gray-800 mb-4'>
                        모의면접 설정 확인
                    </Title>
                    <Paragraph className='!text-lg !text-gray-600 max-w-2xl mx-auto'>
                        모의면접을 시작하기 전에 필요한 장치들의 상태를 확인해주세요.
                    </Paragraph>
                </div>

                {/* 웹캠과 마이크 설정 (나란히 배치) */}
                <Row gutter={[24, 24]} className='mb-8'>
                    {/* 웹캠 상태 */}
                    <Col xs={24} lg={16}>
                        <Card className='!border-0 !shadow-lg' bodyStyle={{ padding: '32px' }}>
                            <Space direction='vertical' size='large' className='w-full'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <VideoCameraOutlined className='text-3xl text-blue-500' />
                                        <Title level={3} className='!mb-0'>
                                            웹캠 상태
                                        </Title>
                                    </div>
                                    {getStatusIcon(
                                        deviceStatus.webcam.available,
                                        deviceStatus.webcam.testing,
                                    )}
                                </div>

                                {deviceStatus.webcam.available && (
                                    <div className='bg-gray-100 rounded-lg p-6 relative'>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            className='w-full h-[480px] object-cover rounded'
                                        />
                                        {/* 가이드 영역 오버레이 */}
                                        <div className='absolute inset-0 pointer-events-none'>
                                            {/* 전체 화면을 덮는 blur 배경 */}
                                            <div
                                                className='absolute inset-0 bg-black bg-opacity-15 backdrop-blur-sm'
                                                style={{
                                                    clipPath:
                                                        'polygon(0% 0%, 0% 100%, 35% 100%, 35% 20%, 65% 20%, 65% 100%, 100% 100%, 100% 0%)',
                                                    background: 'border-box',
                                                }}
                                            ></div>

                                            {/* 가운데 명확한 영역 (화면 너비의 30%, 높이의 70%) */}
                                            <div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[30%] h-[80%]'>
                                                {/* 명확한 영역 (blur 제거) */}
                                                <div className='w-full h-full border-6 border-green-500 rounded-lg flex items-center justify-center'>
                                                    {/* USER 아이콘 */}
                                                </div>

                                                {/* 가이드 메시지 */}
                                                <div className='absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-xs whitespace-nowrap'>
                                                    💡 이 영역에 맞춰 위치해주세요
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {deviceStatus.webcam.error && (
                                    <Alert
                                        message={deviceStatus.webcam.error}
                                        type='error'
                                        showIcon
                                    />
                                )}

                                <Button
                                    onClick={checkWebcam}
                                    loading={deviceStatus.webcam.testing}
                                    icon={<ReloadOutlined />}
                                    size='large'
                                    className='w-full md:w-auto'
                                >
                                    웹캠 다시 테스트
                                </Button>
                            </Space>
                        </Card>
                    </Col>

                    {/* 마이크 상태 */}
                    <Col xs={24} lg={8}>
                        <Card
                            className='!h-full !border-0 !shadow-lg'
                            bodyStyle={{ padding: '32px' }}
                        >
                            <Space direction='vertical' size='large' className='w-full'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <AudioOutlined className='text-3xl text-green-500' />
                                        <Title level={3} className='!mb-0'>
                                            마이크 상태
                                        </Title>
                                    </div>
                                    {getStatusIcon(
                                        deviceStatus.microphone.available,
                                        deviceStatus.microphone.testing,
                                    )}
                                </div>

                                {deviceStatus.microphone.available && (
                                    <div className='bg-gray-100 rounded-lg p-6 text-center'>
                                        <div className='text-4xl mb-4'>🎤</div>
                                        <Text className='text-gray-600 text-base mb-4 block'>
                                            마이크가 정상적으로 작동합니다
                                        </Text>
                                        {/* 마이크 레벨미터 */}
                                        <div className='w-full bg-gray-200 rounded-full h-3 mb-3'>
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
                                        <Text className='text-sm text-gray-500'>
                                            음성 레벨: {micLevel}%
                                        </Text>
                                    </div>
                                )}

                                {deviceStatus.microphone.error && (
                                    <Alert
                                        message={deviceStatus.microphone.error}
                                        type='error'
                                        showIcon
                                    />
                                )}

                                <Button
                                    onClick={checkMicrophone}
                                    loading={deviceStatus.microphone.testing}
                                    icon={<ReloadOutlined />}
                                    size='large'
                                    className='w-full'
                                >
                                    마이크 다시 테스트
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* 전체 상태 요약 */}
                <Card className='!border-0 !shadow-lg mb-8'>
                    <div className='text-center'>
                        <Title level={3} className='!text-2xl !font-bold !text-gray-800 mb-4'>
                            전체 상태 요약
                        </Title>

                        <div className='flex flex-wrap justify-center items-center gap-4 mb-6'>
                            <Badge
                                status={deviceStatus.webcam.available ? 'success' : 'error'}
                                text='웹캠'
                            />
                            <Badge
                                status={deviceStatus.microphone.available ? 'success' : 'error'}
                                text='마이크'
                            />
                        </div>

                        {allTestsPassed ? (
                            <Alert
                                message='모든 테스트가 통과되었습니다! 모의면접을 시작할 수 있습니다.'
                                type='success'
                                showIcon
                                className='mb-6'
                            />
                        ) : (
                            <Alert
                                message="일부 테스트가 실패했습니다. 위의 '다시 테스트' 버튼을 클릭하여 문제를 해결해주세요."
                                type='warning'
                                showIcon
                                className='mb-6'
                            />
                        )}

                        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                            <Button
                                onClick={runAllTests}
                                loading={Object.values(deviceStatus).some(
                                    (status) => status.testing,
                                )}
                                icon={<ReloadOutlined />}
                                size='large'
                                className='!h-12 !px-8'
                            >
                                전체 다시 테스트
                            </Button>

                            <Link href='/ai-interview/sessions'>
                                <Button
                                    type='primary'
                                    size='large'
                                    className='!h-12 !px-8'
                                    disabled={!allTestsPassed}
                                    icon={<ArrowRightOutlined />}
                                >
                                    모의면접 시작하기
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>

                {/* 숨겨진 미디어 요소들 */}
                <video ref={videoRef} style={{ display: 'none' }} />
                <audio ref={audioRef} style={{ display: 'none' }} />
            </div>
        </div>
    );
}
=======
'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Typography, Button, Alert, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
// import Link from "next/link"; // not used in combined UI
import axios from 'axios';

import { Webcam, WebcamHandle } from '../_components/Webcam';
import { VisualAggregatePayload } from '../_components/RealMediaPipeAnalyzer';

const { Title, Paragraph, Text } = Typography;

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

const AUDIO_API_BASE = process.env.NEXT_PUBLIC_AI_API_BASE;
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

    const CALI_TEXT = '나는 어려움을 이겨내며 성장한다.';

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
                        message.warning('다시 말씀해 주세요');
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
            message.info('녹음을 시작했습니다. 자연스럽게 문장을 읽어주세요.');
        } catch (e: any) {
            setPhase('idle');
            setError(e?.message || '캘리브레이션 시작 실패');
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
            message.success('캘리브레이션 저장 완료! 이제 세션을 시작할 수 있어요.');
        } catch (e: any) {
            setError(e?.message || '캘리브레이션 종료 실패');
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
        <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
            <div className='container mx-auto px-4'>
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

                        {error && (
                            <div className='mb-3'>
                                <Alert type='error' showIcon message='오류' description={error} />
                            </div>
                        )}

                        <div className='flex flex-col items-center'>
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
                                        size='small'
                                        disabled={isProcessing}
                                    >
                                        다시 녹음하기
                                    </Button>
                                )}
                            </div>

                            {/* 진행률/타이머 UI 제거 (요청) */}

                            {/* 캘리브레이션 문장 */}
                            <blockquote className='text-2xl text-green-500/80 italic text-center px-6 py-4 border rounded-2xl bg-green-50/40'>
                                “{CALI_TEXT}”
                            </blockquote>

                            {/* 액션들 */}
                            <div className='mt-6 flex gap-3'>
                                <Button
                                    type='primary'
                                    icon={<SaveOutlined />}
                                    onClick={goToSession}
                                    disabled={!(webcamOk && micOk && phase === 'done')}
                                >
                                    세션 시작하기
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
>>>>>>> Stashed changes
