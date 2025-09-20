'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCoachingResumeCanvas } from '../../_hooks';
import { useSessionStore } from '../../_stores';
import { CanvasHeader } from '../../_components';
import { DotOnlyCanvas } from '../../_components/DotOnlyCanvas';
import AudioPlayer from '../../_components/AudioPlayer';

export default function ExitPage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const router = useRouter();
    const resetSession = useSessionStore((s) => s.resetSession);

    // 세션 데이터 가져오기
    const { data: canvasData } = useCoachingResumeCanvas(sessionId);

    return (
        <div className='w-full h-screen overflow-hidden relative'>
            {/* CanvasHeader 상단바 - 메인 페이지와 동일 */}
            <CanvasHeader
                title={canvasData?.name || '오디오 캔버스'}
                onExit={() => {
                    resetSession();
                    router.push('/coaching-resume');
                }}
            />
            {/* 캔버스만 상단에 배치 */}
            <div className='absolute top-[80px] left-5 w-96 h-64 z-10'>
                <DotOnlyCanvas />
            </div>

            {/* 오디오 플레이어를 기존 툴바 위치(아래쪽)에 넓게 배치 */}
            <div className='absolute bottom-[20px] left-5 right-5 z-10'>
                <AudioPlayer />
            </div>
        </div>
    );
}
