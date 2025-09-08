import { CameraBox } from './CameraBox';

export function ParticipantCamera() {
    return (
        <div className='flex justify-center items-center gap-3 absolute top-5 left-1/2 -translate-x-1/2  z-10'>
            <CameraBox isLocal={false} isSpeaking={false} name='신우진' />
            <CameraBox isLocal={true} isSpeaking={true} name='김민규' />
        </div>
    );
}
