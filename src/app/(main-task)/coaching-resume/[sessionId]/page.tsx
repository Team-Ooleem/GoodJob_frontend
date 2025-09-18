'use client';

import { useSessionStore } from '../_stores';
import {
    FabricToolbar,
    FabricCanvas,
    RecordingListPopup,
    SocketProvider,
    WaitingRoom,
    CanvasHeader,
} from '../_components';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { setCanvasIdx, startRecording } from '../_hooks/useVoiceRecorder';

export default function CoachingResumePage() {
    const params = useParams();
    const canvasUuid = params.sessionId as string; // URL에서 sessionId 가져오기
    const sessionStarted = useSessionStore((s) => s.sessionStarted);

    // URL에서 가져온 sessionId를 canvasIdx로 설정
    useEffect(() => {
        if (canvasUuid) {
            setCanvasIdx(canvasUuid);
        }
    }, [canvasUuid]);

    useEffect(() => {
        if (sessionStarted) {
            console.log('🎙️ 세션 시작됨 - 녹화 시작');
            startRecording();
        }
    }, [sessionStarted]);
    if (!sessionStarted) {
        return (
            <>
                <SocketProvider />
                <WaitingRoom />
            </>
        );
    }

    return (
        <>
            <SocketProvider />
            <CanvasHeader title='김아무개의 세션' onExit={() => console.log('나가기')} />
            <FabricToolbar />
            <RecordingListPopup canvasIdx={canvasUuid} />
            <FabricCanvas mentorName='신우진' menteeName='김민규' />
        </>
    );
}
