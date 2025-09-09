'use client';

import Image from 'next/image';
import { useMemo, useEffect, useRef } from 'react';
import { useCanvasStore } from '../_stores';

interface ICameraBox {
    name?: string;
    isLocal: boolean;
    isSpeaking: boolean;
    profileImg?: string;
    stream?: MediaStream | null;
}

export function CameraBox({
    name = '이름없음',
    isLocal,
    isSpeaking,
    profileImg,
    stream,
}: ICameraBox) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const isCamEnabled = useCanvasStore((s) => s.isCamEnabled);
    const isMicEnabled = useCanvasStore((s) => s.isMicEnabled);
    const speakingStyle = isSpeaking ? 'ring-2 ring-blue-500' : '';
    const bgClass = 'bg-[#0b1b2b]'; // 어두운 파란색 배경

    const initial = useMemo(() => {
        const base = isLocal ? 'You' : name || '';
        return base.trim().charAt(0).toUpperCase() || 'U';
    }, [isLocal, name]);

    const showProfileFallback = isLocal && !isCamEnabled;

    // ✅ stream이 바뀔 때 video에 연결
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div
            className={`w-[230px] h-[150px] overflow-hidden ${bgClass} rounded-xl relative ${speakingStyle}`}
        >
            {showProfileFallback ? (
                <div className='w-full h-full flex items-center justify-center'>
                    <div className='w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500 flex items-center justify-center bg-slate-600'>
                        {profileImg ? (
                            <Image src={profileImg} alt='profile' width={64} height={64} />
                        ) : (
                            <span className='text-white text-xl font-semibold'>{initial}</span>
                        )}
                    </div>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className='w-full h-full object-cover'
                />
            )}

            {/* null 자리에 여기에 video 넣으면 됩니다! */}

            <p className='text-white absolute left-2 bottom-1.5 font-medium text-sm flex items-center gap-1'>
                <span>{isLocal ? 'You' : name}</span>
                {isLocal && !isMicEnabled && (
                    <span className='inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500'>
                        <Image
                            src='/assets/mic-off.svg'
                            alt='mic-off'
                            width={12}
                            height={12}
                            className='invert'
                        />
                    </span>
                )}
            </p>
        </div>
    );
}
