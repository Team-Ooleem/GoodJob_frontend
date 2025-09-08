'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useCanvasStore } from '../_stores';

interface ICameraBox {
    name?: string;
    isLocal: boolean;
    isSpeaking: boolean;
    profileImg?: string;
}

export function CameraBox({ name = '이름없음', isLocal, isSpeaking, profileImg }: ICameraBox) {
    const isCamEnabled = useCanvasStore((s) => s.isCamEnabled);
    const speakingStyle = isSpeaking ? 'ring-2 ring-blue-500' : '';
    const bgClass = 'bg-[#0b1b2b]'; // 어두운 파란색 배경

    const initial = useMemo(() => {
        const base = isLocal ? 'You' : name || '';
        return base.trim().charAt(0).toUpperCase() || 'U';
    }, [isLocal, name]);

    const showProfileFallback = isLocal && !isCamEnabled;

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
            ) : null}

            {/* null 자리에 여기에 video 넣으면 됩니다! */}

            <p className='text-white absolute left-2 bottom-1.5 font-medium text-sm'>
                {isLocal ? 'You' : name}
            </p>
        </div>
    );
}
