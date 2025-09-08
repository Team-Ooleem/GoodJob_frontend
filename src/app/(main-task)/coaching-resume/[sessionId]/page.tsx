// local components
import {
    CanvasTitle,
    SessionToolbar,
    FabricToolbar,
    FabricCanvas,
    ParticipantCamera,
    RecordingListPopup,
} from '../_components';

export default function CoachingResumePage() {
    return (
        <>
            <CanvasTitle />
            <SessionToolbar />
            <ParticipantCamera />
            <FabricToolbar />
            <FabricCanvas />
            <RecordingListPopup />
        </>
    );
}
