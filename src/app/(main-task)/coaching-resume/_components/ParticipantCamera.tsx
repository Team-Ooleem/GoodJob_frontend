import { CameraBox } from './CameraBox';
import { useWebRTC } from '../_hooks';

export function ParticipantCamera() {
    const { localStream, remoteStream } = useWebRTC('resume-room');

    return (
        <div className='flex justify-center items-center gap-3 absolute top-5 left-1/2 -translate-x-1/2 z-10'>
            {/* 상대방 */}
            <CameraBox isLocal={false} isSpeaking={false} name='신우진' stream={remoteStream} />
            {/* 나 */}
            <CameraBox isLocal={true} isSpeaking={true} name='김민규' stream={localStream} />
        </div>
    );
}
