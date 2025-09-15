'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Video, VideoOff, ChevronDown } from 'lucide-react';
import { useSessionStore } from '../_stores';

type MediaDevice = {
    deviceId: string;
    label: string;
};

export function WaitingRoom() {
    const startSession = useSessionStore((s) => s.startSession);

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

    return (
        <div className='w-full h-screen flex justify-center items-center px-40 gap-12'>
            {/* Left: Preview */}
            <div className='flex-1'>
                <div className='w-full'>
                    <Card className='relative overflow-hidden rounded-2xl aspect-video bg-muted'>
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
                    <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
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

            {/* Right: Info + CTA */}
            <div className='flex-1 flex justify-center items-center flex-col'>
                <div className='w-full space-y-6'>
                    <div className='space-y-1'>
                        <h2 className='text-2xl font-semibold'>참여할 준비가 되셨나요?</h2>
                        <p className='text-sm text-muted-foreground'>다른 참석자는 없습니다.</p>
                    </div>

                    <Button size='lg' className='w-1/2' onClick={startSession}>
                        지금 참여하기
                    </Button>
                </div>
            </div>
        </div>
    );
}
