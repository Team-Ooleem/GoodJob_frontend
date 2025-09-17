'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Video, VideoOff, User, ChevronLeft } from 'lucide-react';
import { useSessionStore } from '../_stores';

type MediaDevice = {
    deviceId: string;
    label: string;
};

export function WaitingRoom() {
    const router = useRouter();
    const {
        startSession,
        mentorName,
        menteeName,
    } = useSessionStore();

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);

    const [mics, setMics] = useState<MediaDevice[]>([]);
    const [cams, setCams] = useState<MediaDevice[]>([]);
    const [selectedMic, setSelectedMic] = useState<string | undefined>();
    const [selectedCam, setSelectedCam] = useState<string | undefined>();

    // Fetch devices and create initial preview
    useEffect(() => {
        async function prepare() {
            try {
                // Request permission early to get device labels
                const temp = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                });
                setStream(temp);
                if (videoRef.current) {
                    videoRef.current.srcObject = temp;
                }

                const devices = await navigator.mediaDevices.enumerateDevices();
                const micList = devices
                    .filter((d) => d.kind === 'audioinput')
                    .map((d) => ({ deviceId: d.deviceId, label: d.label || '마이크' }));
                const camList = devices
                    .filter((d) => d.kind === 'videoinput')
                    .map((d) => ({ deviceId: d.deviceId, label: d.label || '카메라' }));

                setMics(micList);
                setCams(camList);
                if (!selectedMic && micList[0]) setSelectedMic(micList[0].deviceId);
                if (!selectedCam && camList[0]) setSelectedCam(camList[0].deviceId);
            } catch (e) {
                // ignore for now; UI will just be empty
            }
        }
        prepare();

        return () => {
            setStream((prev) => {
                prev?.getTracks().forEach((t) => t.stop());
                return null;
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Recreate stream when device changes
    useEffect(() => {
        async function switchTracks() {
            if (!selectedMic && !selectedCam) return;
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
                    video: selectedCam
                        ? {
                              deviceId: { exact: selectedCam },
                              width: { ideal: 1280 },
                              height: { ideal: 720 },
                          }
                        : true,
                });

                setStream((prev) => {
                    prev?.getTracks().forEach((t) => t.stop());
                    return newStream;
                });
                if (videoRef.current) videoRef.current.srcObject = newStream;

                // Apply current on/off state
                newStream.getAudioTracks().forEach((t) => (t.enabled = micOn));
                newStream.getVideoTracks().forEach((t) => (t.enabled = camOn));
            } catch (e) {
                // ignore
            }
        }
        switchTracks();
    }, [selectedMic, selectedCam]);

    const toggleMic = () => {
        const next = !micOn;
        stream?.getAudioTracks().forEach((t) => (t.enabled = next));
        setMicOn(next);
    };

    const toggleCam = () => {
        const next = !camOn;
        stream?.getVideoTracks().forEach((t) => (t.enabled = next));
        setCamOn(next);
    };

    const handleJoinSession = () => {
        startSession();
    };

    return (
        <div className='w-full h-screen relative'>
            {/* Back Button */}
            <button
                className='absolute top-6 left-6 z-10 size-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-background/90 flex items-center justify-center transition-colors'
                onClick={() => router.back()}
                aria-label='뒤로가기'
            >
                <ChevronLeft className='h-5 w-5' />
            </button>

            <div className='w-full h-full flex justify-center items-center px-40 gap-12'>
                {/* Left: Preview */}
                <div className='flex-1'>
                    <div className='w-full'>
                        <Card className='relative overflow-hidden rounded-2xl aspect-video bg-muted max-w-2xl mx-auto'>
                            <video
                                ref={videoRef}
                                className={cn(
                                    'h-full w-full object-cover scale-x-[-1]',
                                    !camOn && 'opacity-0',
                                )}
                                autoPlay
                                muted
                                playsInline
                            />

                            {/* Overlay top-left: name placeholder */}
                            <div className='absolute left-4 top-4 rounded-md bg-black/40 text-white text-sm px-2 py-1'>
                                나
                            </div>

                            {/* Dim when camera off */}
                            {!camOn && (
                                <div className='absolute inset-0 flex items-center justify-center bg-black/50 text-white'>
                                    카메라가 꺼져 있습니다
                                </div>
                            )}

                            {/* Bottom controls */}
                            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3'>
                                <button
                                    onClick={toggleMic}
                                    className={cn(
                                        'size-11 rounded-full bg-background text-foreground shadow hover:bg-background/90 flex items-center justify-center',
                                        !micOn && 'bg-red-600 text-white hover:bg-red-600/90',
                                    )}
                                    aria-label='toggle microphone'
                                >
                                    {micOn ? <Mic /> : <MicOff />}
                                </button>
                                <button
                                    onClick={toggleCam}
                                    className={cn(
                                        'size-11 rounded-full bg-background text-foreground shadow hover:bg-background/90 flex items-center justify-center',
                                        !camOn && 'bg-red-600 text-white hover:bg-red-600/90',
                                    )}
                                    aria-label='toggle camera'
                                >
                                    {camOn ? <Video /> : <VideoOff />}
                                </button>
                            </div>
                        </Card>

                        {/* Device selectors */}
                        <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm max-w-2xl mx-auto'>
                            <Select value={selectedMic} onValueChange={setSelectedMic}>
                                <SelectTrigger>
                                    <SelectValue placeholder='마이크 선택' />
                                </SelectTrigger>
                                <SelectContent>
                                    {mics.map((d) => (
                                        <SelectItem key={d.deviceId} value={d.deviceId}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedCam} onValueChange={setSelectedCam}>
                                <SelectTrigger>
                                    <SelectValue placeholder='카메라 선택' />
                                </SelectTrigger>
                                <SelectContent>
                                    {cams.map((d) => (
                                        <SelectItem key={d.deviceId} value={d.deviceId}>
                                            {d.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Right: Participants + CTA */}
                <div className='flex-1 flex justify-center items-center flex-col'>
                    <div className='w-full space-y-6'>
                        <div className='space-y-6'>
                            <div className='space-y-4'>
                                <h2 className='text-lg font-semibold'>참석자 정보</h2>

                                {/* Participants Info */}
                                <Card className='p-0'>
                                    <CardContent className='p-6 space-y-4'>
                                        <div className='flex items-center space-x-4'>
                                            <div className='w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center'>
                                                <User className='h-6 w-6 text-blue-600 dark:text-blue-400' />
                                            </div>
                                            <div>
                                                <p className='font-medium text-lg'>
                                                    {mentorName || '멘토'}
                                                </p>
                                                <p className='text-sm text-muted-foreground'>
                                                    멘토
                                                </p>
                                            </div>
                                        </div>

                                        <div className='flex items-center space-x-4'>
                                            <div className='w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center'>
                                                <User className='h-6 w-6 text-green-600 dark:text-green-400' />
                                            </div>
                                            <div>
                                                <p className='font-medium text-lg'>
                                                    {menteeName || '멘티'}
                                                </p>
                                                <p className='text-sm text-muted-foreground'>
                                                    멘티
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Session Guidelines */}
                            <div className='space-y-4'>
                                <h3 className='text-lg font-semibold'>세션 이용 안내</h3>
                                <Card className='p-0'>
                                    <CardContent className='p-6 space-y-4 text-sm text-muted-foreground'>
                                        <div className='space-y-2'>
                                            <h4 className='font-medium text-foreground'>
                                                📋 세션 진행 방식
                                            </h4>
                                            <ul className='space-y-1 ml-4'>
                                                <li>• 화면 공유를 통해 이력서를 함께 검토합니다</li>
                                                <li>
                                                    • 실시간으로 피드백과 수정사항을 확인할 수
                                                    있습니다
                                                </li>
                                                <li>• 세션 내용은 자동으로 녹화됩니다</li>
                                            </ul>
                                        </div>

                                        <div className='space-y-2'>
                                            <h4 className='font-medium text-foreground'>
                                                ✅ 이용 수칙
                                            </h4>
                                            <ul className='space-y-1 ml-4'>
                                                <li>
                                                    • 원활한 소통을 위해 마이크와 카메라를
                                                    준비해주세요
                                                </li>
                                                <li>
                                                    • 상호 존중하며 건설적인 피드백을 주고받아주세요
                                                </li>
                                                <li>
                                                    • 개인정보 보호를 위해 민감한 정보 공유에
                                                    주의해주세요
                                                </li>
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Button size='lg' className='w-full' onClick={handleJoinSession}>
                                세션 참석하기
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
