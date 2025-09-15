'use client';

import Image from 'next/image';
import { useMemo, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { useCanvasStore } from '../_stores';

interface ICameraBox {
    name?: string;
    isLocal: boolean;
    isSpeaking: boolean;
    isMuted?: boolean;
    profileImg?: string;
    stream?: MediaStream | null;
    size?: 'sm' | 'md' | 'lg';
}

export function CameraBox({
    name = '이름없음',
    isLocal,
    isSpeaking,
    isMuted,
    profileImg,
    stream,
    size,
}: ICameraBox) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const isCamEnabled = useCanvasStore((s) => s.isCamEnabled);
    const isMicEnabled = useCanvasStore((s) => s.isMicEnabled);

    // 마이크 음소거 상태 결정
    const micMuted = isLocal ? !isMicEnabled : (isMuted ?? false);
    // Use shadcn/ui design tokens - 마이크가 꺼져있으면 speaking 효과 비활성화
    const speakingStyle = isSpeaking && !micMuted ? 'ring-2 ring-primary' : '';
    const bgClass = 'bg-muted';

    const initial = useMemo(() => {
        const base = (name || (isLocal ? 'You' : '')).trim();
        return base.charAt(0).toUpperCase() || 'U';
    }, [isLocal, name]);

    const showProfileFallback = isLocal && !isCamEnabled;

    const sizeClass = useMemo(() => {
        const variant = size ?? (isLocal ? 'sm' : 'lg');
        switch (variant) {
            case 'sm':
                return 'w-[180px] h-[116px]';
            case 'lg':
                return 'w-[360px] h-[220px]';
            default:
                return 'w-[230px] h-[150px]';
        }
    }, [size, isLocal]);

    // ✅ stream이 바뀔 때 video에 연결
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // 마이크 상태에 따라 오디오 트랙 음소거 제어
    useEffect(() => {
        if (isLocal && stream) {
            const audioTracks = stream.getAudioTracks();
            audioTracks.forEach((track) => {
                track.enabled = isMicEnabled;
            });
        }
    }, [isLocal, stream, isMicEnabled]);

    return (
        <div
            className={`${sizeClass} overflow-hidden ${bgClass} rounded-xl relative ${speakingStyle}`}
        >
            {showProfileFallback && (
                <div className='w-full h-full flex items-center justify-center'>
                    <div className='w-14 h-14 rounded-full overflow-hidden border-2 border-primary flex items-center justify-center bg-muted-foreground/40'>
                        {profileImg ? (
                            <Image src={profileImg} alt='profile' width={64} height={64} />
                        ) : (
                            <span className='text-foreground text-xl font-semibold'>{initial}</span>
                        )}
                    </div>
                </div>
            )}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`w-full h-full object-cover ${!showProfileFallback ? 'opacity-100' : 'opacity-0'}`}
                style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
            />

            {/* 이름 뱃지 + 마이크 상태 */}
            <div className='absolute left-2 bottom-1.5 font-medium text-sm flex items-center gap-1'>
                <Badge variant='secondary' className='px-2 py-0.5'>
                    {name ?? (isLocal ? 'You' : '이름없음')}
                </Badge>
                {micMuted && (
                    <span className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive'>
                        <Image
                            src='/assets/mic-off.svg'
                            alt='mic-off'
                            width={12}
                            height={12}
                            className='invert'
                        />
                    </span>
                )}
            </div>
        </div>
    );
}
