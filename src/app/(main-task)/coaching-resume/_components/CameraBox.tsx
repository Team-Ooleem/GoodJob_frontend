'use client';

import Image from 'next/image';
import { useMemo, useRef, useEffect } from 'react';
import { useCanvasStore } from '../_stores';

interface ICameraBox {
    name?: string;
    isLocal: boolean;
    isSpeaking: boolean;
    profileImg?: string;
    stream?: MediaStream | null; // ✅ 추가
}

export function CameraBox({
    name = '이름없음',
    isLocal,
    isSpeaking,
    profileImg,
    stream,
}: ICameraBox) {
    const isCamEnabled = useCanvasStore((s) => s.isCamEnabled);
    const isMicEnabled = useCanvasStore((s) => s.isMicEnabled);
    const videoRef = useRef<HTMLVideoElement>(null);

    const speakingStyle = isSpeaking ? 'ring-2 ring-blue-500' : '';
    const bgClass = 'bg-[#0b1b2b]';

    const initial = useMemo(() => {
        const base = isLocal ? 'You' : name || '';
        return base.trim().charAt(0).toUpperCase() || 'U';
    }, [isLocal, name]);

    const showProfileFallback = !stream || (isLocal && !isCamEnabled);

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
            {!showProfileFallback && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal} // 로컬 echo 방지
                    className='w-full h-full object-cover'
                />
            )}

            {showProfileFallback && (
                <div className='w-full h-full flex items-center justify-center'>
                    <div className='w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500 flex items-center justify-center bg-slate-600'>
                        {profileImg ? (
                            <Image src={profileImg} alt='profile' width={64} height={64} />
                        ) : (
                            <span className='text-white text-xl font-semibold'>{initial}</span>
                        )}
                    </div>
                </div>
            )}

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
