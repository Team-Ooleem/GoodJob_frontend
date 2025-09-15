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
    isCamMuted?: boolean;
    profileImg?: string;
    stream?: MediaStream | null;
    size?: 'sm' | 'md' | 'lg';
    isConnected?: boolean; // WebRTC 연결 상태
}

export function CameraBox({
    name = '이름없음',
    isLocal,
    isSpeaking,
    isMuted,
    isCamMuted,
    profileImg,
    stream,
    size,
    isConnected = false,
}: ICameraBox) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const isCamEnabled = useCanvasStore((s) => s.isCamEnabled);
    const isMicEnabled = useCanvasStore((s) => s.isMicEnabled);

    // 마이크 음소거 상태 결정
    const micMuted = isLocal ? !isMicEnabled : (isMuted ?? false);
    // 카메라 음소거 상태 결정 - 로컬/원격 모두 카메라 꺼짐, 연결 안됨, 스트림 없음 시 대체화면 표시
    const camMuted = isLocal
        ? !isCamEnabled || !stream
        : !isConnected || !stream || (isCamMuted ?? false);

    // 디버깅: 상대방 카메라일 때 상세 상태 확인
    useEffect(() => {
        if (!isLocal) {
            const videoTracks = stream?.getVideoTracks() || [];
            console.log('🎥 Remote camera debug:', {
                name,
                camMuted,
                hasStream: !!stream,
                videoTracksCount: videoTracks.length,
                videoTracksEnabled: videoTracks.map((track) => ({
                    id: track.id,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    kind: track.kind,
                })),
                streamActive: stream?.active,
            });
        }
    }, [isLocal, name, camMuted, stream]);

    // Use shadcn/ui design tokens - 마이크가 꺼져있으면 speaking 효과 비활성화
    const speakingStyle = isSpeaking && !micMuted ? 'ring-2 ring-primary' : 'border';
    const bgClass = 'bg-muted';

    const initial = useMemo(() => {
        const base = (name || (isLocal ? 'You' : '')).trim();
        return base.charAt(0).toUpperCase() || 'U';
    }, [isLocal, name]);

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

    // 카메라 상태에 따라 비디오 트랙 제어
    useEffect(() => {
        if (isLocal && stream) {
            const videoTracks = stream.getVideoTracks();
            videoTracks.forEach((track) => {
                track.enabled = isCamEnabled;
            });
        }
    }, [isLocal, stream, isCamEnabled]);

    return (
        <div
            className={`${sizeClass} overflow-hidden ${bgClass} rounded-xl relative ${speakingStyle}`}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`w-full h-full object-cover ${camMuted ? 'opacity-0' : 'opacity-100'}`}
                style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
            />

            {camMuted && (
                <div className='absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-muted'>
                    <div className='w-16 h-16 rounded-full overflow-hidden border-2 border-primary flex items-center justify-center bg-muted-foreground/40 mb-3'>
                        {profileImg ? (
                            <Image src={profileImg} alt='profile' width={64} height={64} />
                        ) : (
                            <span className='text-foreground text-xl font-semibold'>{initial}</span>
                        )}
                    </div>
                    {!isLocal && !isConnected && (
                        <p className='text-sm text-muted-foreground text-center px-4'>연결 중...</p>
                    )}
                    {!isLocal && isConnected && !stream && (
                        <p className='text-sm text-muted-foreground text-center px-4'>연결 중...</p>
                    )}
                    {isLocal && !stream && (
                        <p className='text-sm text-muted-foreground text-center px-4'>연결 중...</p>
                    )}
                </div>
            )}

            {/* 이름 뱃지 + 마이크 상태 */}
            <div className='absolute left-2 bottom-1.5 font-medium text-sm flex items-center gap-1'>
                <Badge variant={camMuted ? 'default' : 'secondary'} className='px-2 py-0.5'>
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
