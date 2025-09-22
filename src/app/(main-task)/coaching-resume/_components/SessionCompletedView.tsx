'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CanvasHeader } from './CanvasHeader';
import { DotOnlyCanvas } from './DotOnlyCanvas';
import AudioPlayer from './AudioPlayer';
import { SocketProvider } from './SocketProvider';
import { useSessionStore } from '../_stores';
import { CoachingResumeApi } from '@/apis/coaching-resume-api';

interface SessionCompletedViewProps {
    canvasData?: {
        name?: string;
        application_id?: number;
        application_status?: string;
        scheduled_at?: string;
        [key: string]: any;
    };
    canvasId?: string;
}

export function SessionCompletedView({ canvasData, canvasId }: SessionCompletedViewProps) {
    const router = useRouter();
    const resetSession = useSessionStore((s) => s.resetSession);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            if (!canvasId) {
                // Fallback to local logic if canvasId is not available
                const localCompleted = (() => {
                    if (canvasData?.application_status === 'completed') {
                        return true;
                    }
                    if (canvasData?.application_status === 'approved' && canvasData?.scheduled_at) {
                        const scheduledTime = new Date(canvasData.scheduled_at);
                        const now = new Date();
                        return scheduledTime <= now;
                    }
                    return false;
                })();
                setIsCompleted(localCompleted);
                setIsLoading(false);
                return;
            }

            try {
                const status = await CoachingResumeApi.checkSessionStatus(canvasId);
                setIsCompleted(status.isCompleted);
                console.log('✅ API 완료 상태:', status);
            } catch (error) {
                console.error('❌ API 확인 실패, 로컬 로직 사용:', error);
                // Fallback to local logic if API fails
                const localCompleted = (() => {
                    if (canvasData?.application_status === 'completed') {
                        return true;
                    }
                    if (canvasData?.application_status === 'approved' && canvasData?.scheduled_at) {
                        const scheduledTime = new Date(canvasData.scheduled_at);
                        const now = new Date();
                        return scheduledTime <= now;
                    }
                    return false;
                })();
                setIsCompleted(localCompleted);
            } finally {
                setIsLoading(false);
            }
        };

        checkStatus();
    }, [canvasId, canvasData]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isCompleted) {
        return null;
    }

    return (
        <div className='w-full h-screen overflow-hidden relative'>
            <SocketProvider />

            {/* CanvasHeader 상단바 */}
            <CanvasHeader
                title={canvasData?.name || '오디오 캔버스'}
                onExit={() => {
                    resetSession();
                    router.push('/my-page');
                }}
            />

            {/* 완료된 캔버스 표시 */}
            <div className='absolute top-[80px] left-5 w-96 h-64 z-10'>
                <DotOnlyCanvas />
            </div>

            {/* 오디오 플레이어 */}
            <div className='absolute bottom-[20px] left-5 right-5 z-10'>
                <AudioPlayer />
            </div>
        </div>
    );
}
