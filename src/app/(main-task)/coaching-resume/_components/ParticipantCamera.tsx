'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CameraBox } from './CameraBox';
import { useWebRTC } from '../_hooks';

export function ParticipantCamera() {
    const params = useParams();
    const canvasId = params.sessionId as string;
    const { localStream, remoteStream, joinRoom, isLocalSpeaking, isRemoteSpeaking } =
        useWebRTC(canvasId);

    useEffect(() => {
        if (canvasId) {
            joinRoom(canvasId);
        }
    }, [joinRoom, canvasId]);

    return (
        <div className='flex justify-center items-center gap-3 absolute top-5 left-1/2 -translate-x-1/2 z-10'>
            <CameraBox
                isLocal={false}
                isSpeaking={isRemoteSpeaking}
                name='상대방'
                stream={remoteStream}
            />
            <CameraBox isLocal={true} isSpeaking={isLocalSpeaking} name='나' stream={localStream} />
        </div>
    );
}
