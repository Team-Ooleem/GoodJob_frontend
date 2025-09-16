'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '../_stores/useCanvasStore';

export const useRecordingSync = () => {
    // ✅ export function → export const로 변경
    const socket = useCanvasStore((s) => s.socket);

    useEffect(() => {
        if (!socket) return;

        const handleRecordingStatus = (data: { isRecording: boolean; userId: number }) => {
            console.log(
                `🎤 다른 사용자 녹음 상태 변경: User ${data.userId} - ${data.isRecording ? '시작' : '중지'}`,
            );

            if (data.isRecording) {
                console.log('🔴 다른 사용자가 녹음 중입니다');
            } else {
                console.log('⚪ 다른 사용자 녹음이 중지되었습니다');
            }
        };

        socket.on('recordingStatus', handleRecordingStatus);
        console.log('🎧 녹음 상태 동기화 리스너 등록됨');

        return () => {
            socket.off('recordingStatus', handleRecordingStatus);
        };
    }, [socket]);
};
