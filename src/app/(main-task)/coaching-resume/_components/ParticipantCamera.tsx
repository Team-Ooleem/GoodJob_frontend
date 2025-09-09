'use client';

import { useEffect } from 'react';
import { CameraBox } from './CameraBox';
import { useWebRTC } from '../_hooks';

export function ParticipantCamera() {
    const { localStream, remoteStream, joinRoom, isLocalSpeaking, isRemoteSpeaking, unmount } =
        useWebRTC('resume-room');

    useEffect(() => {
        joinRoom('resume-room');

        // 컴포넌트 언마운트 시 정리 작업
        return () => {
            console.log('🧹 ParticipantCamera 언마운트: WebRTC 정리 시작');
            unmount();
        };
    }, [joinRoom, unmount]);

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
