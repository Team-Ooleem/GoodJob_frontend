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

export default function CoachingResumePage() {
    const sessionStarted = useSessionStore((s) => s.sessionStarted);

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
            <RecordingListPopup />
        </>
    );
}
