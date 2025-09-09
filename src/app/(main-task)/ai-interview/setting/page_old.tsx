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

                            <Link href='/ai-interview/calibration'>
                                <Button
                                    type='primary'
                                    size='large'
                                    className='!h-12 !px-8'
                                    disabled={!allTestsPassed}
                                    icon={<ArrowRightOutlined />}
                                >
                                    캘리브레이션 진행하기
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
