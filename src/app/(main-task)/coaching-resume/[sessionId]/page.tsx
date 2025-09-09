// local components
import {
    CanvasTitle,
    SessionToolbar,
    FabricToolbar,
    FabricCanvas,
    ParticipantCamera,
    RecordingListPopup,
    SocketProvider,
} from '../_components';

export default function CoachingResumePage() {
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
