// local components
import {
    CanvasTitle,
    SessionToolbar,
    FabricToolbar,
    FabricCanvas,
    ParticipantCamera,
} from '../_components';

export default function CoachingResumePage() {
    return (
        <>
            <CanvasTitle />
            <SessionToolbar />
            <ParticipantCamera />
            <FabricToolbar />
            <FabricCanvas />
        </>
    );
}
