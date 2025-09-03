'use client';

interface AvatarProps {
    name: string;
    title: string;
    isSpeaking?: boolean;
}

export function Avatar({ name, title, isSpeaking = false }: AvatarProps) {
    return (
        <div className='flex flex-col items-center justify-center h-full'>
            {/* AI 아바타 이미지 영역 */}
            <div className='relative mb-6'>
                <div className='w-96 h-[480px] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl border border-white/20'>
                    {/* 배경 패턴 */}
                    <div className='absolute inset-0 opacity-5'>
                        <div className='absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full blur-xl'></div>
                        <div className='absolute bottom-10 right-10 w-16 h-16 bg-indigo-400 rounded-full blur-xl'></div>
                        <div className='absolute top-1/2 left-1/4 w-12 h-12 bg-purple-400 rounded-full blur-lg'></div>
                    </div>

                    {/* AI 아바타 이미지 */}
                    <div className='w-full h-full flex items-center justify-center relative z-10'>
                        <div className='text-center'>
                            {/* 아바타 프로필 */}
                            <div className='relative mb-6'>
                                <div className='w-48 h-48 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-xl relative overflow-hidden'>
                                    {/* 프로필 이미지 대신 그라데이션 아바타 */}
                                    <div className='w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-full flex items-center justify-center'>
                                        <div className='text-7xl text-white drop-shadow-lg'>👩‍💼</div>
                                    </div>

                                    {/* 말하고 있을 때 글로우 효과 */}
                                    {isSpeaking && (
                                        <div className='absolute inset-0 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-full animate-pulse opacity-50'></div>
                                    )}
                                </div>

                                {/* 말하고 있을 때 파동 효과 */}
                                {isSpeaking && (
                                    <>
                                        <div className='absolute inset-0 w-48 h-48 border-2 border-blue-400 rounded-full animate-ping opacity-75'></div>
                                        <div
                                            className='absolute inset-0 w-48 h-48 border border-indigo-300 rounded-full animate-ping opacity-50'
                                            style={{ animationDelay: '0.5s' }}
                                        ></div>
                                    </>
                                )}
                            </div>

                            {/* 이름과 직책 */}
                            <div className='space-y-2'>
                                <div className='text-2xl font-bold text-gray-800 drop-shadow-sm'>
                                    {name}
                                </div>
                                <div className='text-base text-gray-600 bg-white/60 backdrop-blur-sm rounded-full px-4 py-1 inline-block'>
                                    {title}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 말하고 있을 때 전체 배경 효과 */}
                    {isSpeaking && (
                        <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 animate-pulse'></div>
                    )}
                </div>

                {/* 말하고 있을 때 상태 표시 */}
                {isSpeaking && (
                    <div className='absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce'>
                        <div className='w-4 h-4 bg-white rounded-full flex items-center justify-center'>
                            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
                        </div>
                    </div>
                )}

                {/* 말하고 있을 때 텍스트 표시 */}
                {isSpeaking && (
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
