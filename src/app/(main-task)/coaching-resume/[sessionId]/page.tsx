'use client';

import { useSessionStore } from '../_stores';
import {
    CanvasTitle,
    SessionToolbar,
    FabricToolbar,
    FabricCanvas,
    ParticipantCamera,
    RecordingListPopup,
    SocketProvider,
    WaitingRoom,
} from '../_components';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { setCanvasIdx } from '../_hooks/useVoiceRecorder';

export default function CoachingResumePage() {
    const params = useParams();
    const canvasUuid = params.sessionId as string; // URL에서 sessionId 가져오기
    const sessionStarted = useSessionStore((s) => s.sessionStarted);

    // URL에서 가져온 sessionId를 canvasIdx로 설정
    useEffect(() => {
        if (canvasUuid) {
            setCanvasIdx(canvasUuid); // resume-room15로 설정
        }
    }, [canvasUuid]);
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
            <CanvasTitle />
            <SessionToolbar />
            <ParticipantCamera />
            <FabricToolbar />
            <FabricCanvas />
            <RecordingListPopup canvasIdx={canvasUuid} />
        </>
    );
}
