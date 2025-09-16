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
            <CanvasHeader title='김아무개의 세션' onExit={() => console.log('나가기')} />
            <FabricToolbar />
            <FabricCanvas mentorName='신우진' menteeName='김민규' />
            <RecordingListPopup />
        </>
    );
}
