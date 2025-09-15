// src/app/(main-task)/coaching-resume/[sessionId]/exit/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FabricCanvas, SocketProvider } from '../../_components';
import AudioPlayer from '../../_components/AudioPlayer';

export default function ExitPage() {
    const router = useRouter();

    return (
        <div className='w-full h-screen overflow-hidden relative'>
            {/* 캔버스만 상단에 배치 */}
            <div className='absolute top-5 left-5 w-96 h-64 bg-white rounded-lg shadow-lg border z-10'>
                <FabricCanvas />
            </div>

            {/* 오디오 플레이어를 기존 툴바 위치(아래쪽)에 넓게 배치 */}
            <div className='absolute bottom-[20px] left-5 right-5 z-10'>
                <AudioPlayer />
            </div>

            {/* 나가기 버튼 */}
            <div className='absolute top-5 right-4 z-[10]'>
                <Button onClick={() => router.push('/coaching-resume')}>완전히 나가기</Button>
            </div>
        </div>
    );
}
