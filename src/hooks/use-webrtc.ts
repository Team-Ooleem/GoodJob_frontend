'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type UseWebRTCReturn = {
    localVideoRef: React.RefObject<HTMLVideoElement>;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    isJoined: boolean;
    isMicEnabled: boolean;
    isCamEnabled: boolean;
    isScreenSharing: boolean;
    isCanvasSharing: boolean;
    join: (roomId: string) => Promise<void>;
    leave: () => void;
    toggleMic: () => void;
    toggleCam: () => void;
    shareScreen: () => Promise<void>;
    shareCanvas: (canvas: HTMLCanvasElement, fps?: number) => Promise<void>;
    stopShare: () => void;
};

type SignalMessage =
    | { type: 'offer'; roomId: string; sdp: RTCSessionDescriptionInit }
    | { type: 'answer'; roomId: string; sdp: RTCSessionDescriptionInit }
    | { type: 'ice'; roomId: string; candidate: RTCIceCandidateInit }
    | { type: 'join'; roomId: string }
    | { type: 'leave'; roomId: string };

export function useWebRTC(userId?: string | number | null): UseWebRTCReturn {
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const roomIdRef = useRef<string | null>(null);

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const screenTrackRef = useRef<MediaStreamTrack | null>(null);
    const canvasTrackRef = useRef<MediaStreamTrack | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [isJoined, setIsJoined] = useState(false);
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [isCamEnabled, setIsCamEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isCanvasSharing, setIsCanvasSharing] = useState(false);

    const signalUrl = useMemo(() => {
        return (
            process.env.NEXT_PUBLIC_SIGNAL_URL ||
            process.env.NEXT_PUBLIC_CHAT_WEBSOCKET_URL ||
            ''
        );
    }, []);

    const ensureSocket = useCallback(() => {
        if (socketRef.current || !signalUrl) return socketRef.current;
        const socket = io(signalUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
        });
        socketRef.current = socket;
        return socket;
    }, [signalUrl]);

    const ensurePeer = useCallback(() => {
        if (pcRef.current) return pcRef.current;
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        });
        pc.onicecandidate = (e) => {
            if (e.candidate && roomIdRef.current) {
                socketRef.current?.emit('webrtc:signal', {
                    type: 'ice',
                    roomId: roomIdRef.current,
                    candidate: e.candidate.toJSON(),
                } as SignalMessage);
            }
        };
        pc.ontrack = (e) => {
            // Assuming single remote stream track
            const [stream] = e.streams;
            if (!remoteStreamRef.current) {
                remoteStreamRef.current = stream;
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
        };
        pcRef.current = pc;
        return pc;
    }, []);

    const attachLocalStream = useCallback(async () => {
        if (localStreamRef.current) return localStreamRef.current;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = ensurePeer();
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        return stream;
    }, [ensurePeer]);

    const handleSignal = useCallback(
        async (msg: SignalMessage) => {
            const pc = ensurePeer();
            switch (msg.type) {
                case 'offer': {
                    await attachLocalStream();
                    await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    if (roomIdRef.current) {
                        socketRef.current?.emit('webrtc:signal', {
                            type: 'answer',
                            roomId: roomIdRef.current,
                            sdp: answer,
                        } as SignalMessage);
                    }
                    break;
                }
                case 'answer': {
                    await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                    break;
                }
                case 'ice': {
                    if (msg.candidate) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                        } catch (e) {
                            console.warn('Failed to add ICE candidate', e);
                        }
                    }
                    break;
                }
                case 'leave': {
                    // remote left
                    remoteStreamRef.current = null;
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                    break;
                }
            }
        },
        [attachLocalStream, ensurePeer],
    );

    const join = useCallback(
        async (roomId: string) => {
            if (!signalUrl) {
                console.warn('Signal server URL not configured');
                return;
            }
            roomIdRef.current = roomId;
            ensureSocket();
            const socket = socketRef.current!;

            // register listeners once
            socket.off('webrtc:signal');
            socket.on('webrtc:signal', handleSignal);

            await attachLocalStream();

            // Create offer as initiator
            const pc = ensurePeer();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc:join', { type: 'join', roomId } as SignalMessage);
            socket.emit('webrtc:signal', { type: 'offer', roomId, sdp: offer } as SignalMessage);
            setIsJoined(true);
        },
        [attachLocalStream, ensurePeer, ensureSocket, handleSignal, signalUrl],
    );

    const leave = useCallback(() => {
        const roomId = roomIdRef.current;
        if (roomId) {
            socketRef.current?.emit('webrtc:signal', { type: 'leave', roomId } as SignalMessage);
        }
        roomIdRef.current = null;

        // stop tracks
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;

        // clear share tracks
        screenTrackRef.current?.stop();
        canvasTrackRef.current?.stop();
        screenTrackRef.current = null;
        canvasTrackRef.current = null;
        setIsScreenSharing(false);
        setIsCanvasSharing(false);

        // close pc
        pcRef.current?.getSenders().forEach((s) => pcRef.current?.removeTrack(s));
        pcRef.current?.close();
        pcRef.current = null;

        setIsJoined(false);
    }, []);

    const toggleMic = useCallback(() => {
        const tracks = localStreamRef.current?.getAudioTracks() || [];
        const next = !tracks[0]?.enabled;
        tracks.forEach((t) => (t.enabled = next));
        setIsMicEnabled(next);
    }, []);

    const toggleCam = useCallback(() => {
        const tracks = localStreamRef.current?.getVideoTracks() || [];
        const next = !tracks[0]?.enabled;
        tracks.forEach((t) => (t.enabled = next));
        setIsCamEnabled(next);
    }, []);

    const replaceVideoTrack = useCallback((newTrack: MediaStreamTrack | null) => {
        const pc = pcRef.current;
        if (!pc) return;
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
            sender.replaceTrack(newTrack);
        }
    }, []);

    const shareScreen = useCallback(async () => {
        try {
            const displayStream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
                video: true,
            });
            const [track] = displayStream.getVideoTracks();
            screenTrackRef.current = track;
            replaceVideoTrack(track);
            setIsScreenSharing(true);
            setIsCanvasSharing(false);

            track.onended = () => {
                // revert to camera track when screen share ends
                const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
                replaceVideoTrack(camTrack);
                setIsScreenSharing(false);
            };
        } catch (e) {
            console.warn('Screen share cancelled or failed', e);
        }
    }, [replaceVideoTrack]);

    const shareCanvas = useCallback(
        async (canvas: HTMLCanvasElement, fps = 15) => {
            try {
                const stream = canvas.captureStream(fps);
                const [track] = stream.getVideoTracks();
                canvasTrackRef.current = track;
                replaceVideoTrack(track);
                setIsCanvasSharing(true);
                setIsScreenSharing(false);

                track.onended = () => {
                    const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
                    replaceVideoTrack(camTrack);
                    setIsCanvasSharing(false);
                };
            } catch (e) {
                console.warn('Canvas share failed', e);
            }
        },
        [replaceVideoTrack],
    );

    const stopShare = useCallback(() => {
        screenTrackRef.current?.stop();
        canvasTrackRef.current?.stop();
        screenTrackRef.current = null;
        canvasTrackRef.current = null;
        const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
        replaceVideoTrack(camTrack);
        setIsScreenSharing(false);
        setIsCanvasSharing(false);
    }, [replaceVideoTrack]);

    useEffect(() => {
        return () => {
            leave();
            if (socketRef.current) {
                socketRef.current.off('webrtc:signal');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [leave]);

    return {
        localVideoRef,
        remoteVideoRef,
        isJoined,
        isMicEnabled,
        isCamEnabled,
        isScreenSharing,
        isCanvasSharing,
        join,
        leave,
        toggleMic,
        toggleCam,
        shareScreen,
        shareCanvas,
        stopShare,
    };
}

