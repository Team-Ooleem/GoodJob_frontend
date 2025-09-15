'use client';

import { useEffect } from 'react';
import { CameraBox } from './CameraBox';
import { useWebRTC } from '../_hooks';

type Props = {
    mentorName?: string;
    menteeName?: string;
};

export function ParticipantCamera({ mentorName, menteeName }: Props) {
    const {
        localStream,
        remoteStream,
        joinRoom,
        isLocalSpeaking,
        isRemoteSpeaking,
        isMuted,
        isRemoteMuted,
        isRemoteCameraOff,
        isConnected,
    } = useWebRTC('resume-room');

    useEffect(() => {
        joinRoom('resume-room');
    }, [joinRoom]);

    return (
        <div className='absolute top-5 right-5 z-40'>
            <div className='relative flex flex-col items-end gap-3'>
                <CameraBox
                    isLocal={false}
                    isSpeaking={isRemoteSpeaking}
                    isMuted={isRemoteMuted}
                    isCamMuted={isRemoteCameraOff}
                    name={mentorName ?? '상대방'}
                    stream={remoteStream}
                    size='lg'
                    isConnected={isConnected}
                />
                <CameraBox
                    isLocal={true}
                    isSpeaking={isLocalSpeaking}
                    isMuted={isMuted}
                    name={menteeName ?? '나'}
                    stream={localStream}
                    size='sm'
                    isConnected={isConnected}
                />
            </div>
        </div>
    );
}
