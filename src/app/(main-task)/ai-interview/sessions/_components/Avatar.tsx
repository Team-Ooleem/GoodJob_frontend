'use client';

import { useMemo } from 'react';
import { API_BASE_URL, AI_API_BASE } from '@/constants/config';

interface AvatarProps {
    name: string;
    title: string;
    isSpeaking?: boolean;
    videoUrl?: string | null; // speaking 클립 URL (일시적)
    onEnded?: () => void;
}

// Idle 클립 기본 파라미터
const DEFAULT_RESOLUTION = 256 as const;
const DEFAULT_DURATION_SEC = 10 as const;

export function Avatar({ name, title, isSpeaking = false, videoUrl, onEnded }: AvatarProps) {
    const hasSpeakingVideo = !!videoUrl;
    // 시각 효과(배지/배경 펄스 등)에는 기존 플래그 유지
    const speakingVisual = isSpeaking || hasSpeakingVideo;

    const defaultAvatarId = process.env.NEXT_PUBLIC_DEFAULT_AVATAR_ID;

    // Idle 비디오 URL 구성: /avatar/idle?avatar_id=...&resolution=...&duration=...
    const idleSrc = useMemo(() => {
        if (!defaultAvatarId) return null;
        const p = new URLSearchParams({
            avatar_id: defaultAvatarId,
            resolution: String(DEFAULT_RESOLUTION),
            duration: String(DEFAULT_DURATION_SEC),
        });
        // 우선순위: AI_API_BASE(예: http://localhost:8081) → API_BASE_URL(게이트웨이 경유)
        let base = AI_API_BASE || API_BASE_URL;
        // 혼합 콘텐츠 방지: 페이지가 https인데 base가 http이면 게이트웨이로 폴백
        // if (typeof window !== 'undefined' && window.location.protocol === 'https:' && base.startsWith('http://')) {
        //     base = API_BASE_URL;
        // }
        return `${base}/avatar/idle?${p.toString()}`;
    }, [defaultAvatarId]);

    return (
        <div className='flex flex-col items-center justify-center h-full'>
            {/* AI 아바타 이미지/비디오 영역 */}
            <div className='relative mb-6'>
                <div className='w-96 h-[480px] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl border border-white/20'>
                    {/* 배경 패턴 */}
                    <div className='absolute inset-0 opacity-5 pointer-events-none select-none'>
                        <div className='absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full blur-xl'></div>
                        <div className='absolute bottom-10 right-10 w-16 h-16 bg-indigo-400 rounded-full blur-xl'></div>
                        <div className='absolute top-1/2 left-1/4 w-12 h-12 bg-purple-400 rounded-full blur-lg'></div>
                    </div>

                    {/* Idle 비디오: 항상 로드해두고 loop, muted, playsInline */}
                    {idleSrc ? (
                        <video
                            key={idleSrc}
                            src={idleSrc}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                                hasSpeakingVideo ? 'opacity-0' : 'opacity-100'
                            }`}
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls={false}
                            crossOrigin='anonymous'
                        />
                    ) : (
                        // idleSrc가 없을 때의 정적 아바타 플레이스홀더
                        <div className='w-full h-full flex items-center justify-center relative z-10'>
                            <div className='text-center'>
                                <div className='relative mb-6'>
                                    <div className='w-48 h-48 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-xl relative overflow-hidden'>
                                        <div className='w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-full flex items-center justify-center'>
                                            <div className='text-7xl text-white drop-shadow-lg'>
                                                👩‍💼
                                            </div>
                                        </div>
                                        {speakingVisual && (
                                            <div className='absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-full animate-pulse opacity-50'></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Speaking 비디오: 말하기 클립이 들어오면 idle 위에 오버레이 */}
                    {videoUrl && (
                        <video
                            key={videoUrl}
                            src={videoUrl}
                            className='absolute inset-0 w-full h-full object-cover'
                            autoPlay
                            playsInline
                            controls={false}
                            muted={false}
                            onEnded={onEnded}
                        />
                    )}

                    {/* 말하고 있을 때 전체 배경 효과 */}
                    {speakingVisual && (
                        <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 animate-pulse pointer-events-none'></div>
                    )}
                </div>

                {/* 말하고 있을 때 상태 표시 */}
                {speakingVisual && (
                    <div className='absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce'>
                        <div className='w-4 h-4 bg-white rounded-full flex items-center justify-center'>
                            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                        </div>
                    </div>
                )}

                {/* 말하고 있을 때 텍스트 표시 */}
                {speakingVisual && (
                    <div className='absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg'>
                        <div className='text-sm text-gray-700 font-medium flex items-center space-x-2'>
                            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                            <span>말하는 중...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
