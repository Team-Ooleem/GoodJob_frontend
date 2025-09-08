// local components
import { FabricToolbar, FabricCanvas, CameraBox } from '../_components';

export default function CoachingResumePage() {
    return (
        <>
            <CameraBox name='김민규' isLocal isSpeaking />
            <FabricToolbar />
            <FabricCanvas />
        </>
    );
}
