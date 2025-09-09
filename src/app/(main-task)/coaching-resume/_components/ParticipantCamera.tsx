'use client';

import { useEffect } from 'react';
import { CameraBox } from './CameraBox';
import { useWebRTC } from '../_hooks';

export function ParticipantCamera() {
    const { localStream, remoteStream, joinRoom } = useWebRTC('resume-room');

    useEffect(() => {
        joinRoom('resume-room');
    }, [joinRoom]);

    return (
        <div className='flex justify-center items-center gap-3 absolute top-5 left-1/2 -translate-x-1/2 z-10'>
            <CameraBox isLocal={false} isSpeaking={false} name='상대방' stream={remoteStream} />
            <CameraBox isLocal={true} isSpeaking={true} name='나' stream={localStream} />
        </div>
    );
}
