'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../_stores';

export interface UseWebRTC {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;

    isConnected: boolean;
    isMuted: boolean;
    isCameraOff: boolean;
    error: string | null;

    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
    startCall: () => Promise<void>;
    endCall: () => void;
    toggleMic: () => void;
    toggleCamera: () => void;

    onRemoteStream?: (stream: MediaStream) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

type Options = {
    onRemoteStream?: (stream: MediaStream) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
};

export const useWebRTC = (room?: string, options?: Options): UseWebRTC => {
    const socket = useCanvasStore((s) => s.socket);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const roomRef = useRef<string | null>(room ?? null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onRemoteStream = options?.onRemoteStream;
    const onConnectionStateChange = options?.onConnectionStateChange;

    const ensurePeer = useCallback((): RTCPeerConnection => {
        if (pcRef.current) return pcRef.current;
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        });

        pc.onicecandidate = (e) => {
            if (e.candidate && roomRef.current) {
                const currentSocket = useCanvasStore.getState().socket;
                currentSocket?.emit('ice-candidate', {
                    room: roomRef.current,
                    candidate: e.candidate.toJSON(),
                });
            }
        };

        pc.ontrack = (e) => {
            const [stream] = e.streams;
            setRemoteStream(stream); // ✅ state 업데이트
            onRemoteStream?.(stream);
        };

        pc.onconnectionstatechange = () => {
            setIsConnected(pc.connectionState === 'connected');
            onConnectionStateChange?.(pc.connectionState);
        };

        pcRef.current = pc;
        return pc;
    }, [onConnectionStateChange, onRemoteStream]);

    const attachLocalMedia = useCallback(async () => {
        if (localStream) return localStream;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setLocalStream(stream); // ✅ state 업데이트
            const pc = ensurePeer();
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            return stream;
        } catch (e: any) {
            setError(e?.message || 'Failed to get user media');
            throw e;
        }
    }, [ensurePeer, localStream]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            if (roomRef.current) socket.emit('join', roomRef.current);
        };

        const handleOffer = async (payload: { sdp: RTCSessionDescriptionInit; from: string }) => {
            try {
                await attachLocalMedia();
                const pc = ensurePeer();
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                if (roomRef.current) {
                    socket.emit('answer', { room: roomRef.current, sdp: answer });
                }
            } catch (e: any) {
                setError(e?.message || 'Failed handling offer');
            }
        };

        const handleAnswer = async (payload: { sdp: RTCSessionDescriptionInit; from: string }) => {
            try {
                const pc = ensurePeer();
                await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            } catch (e: any) {
                setError(e?.message || 'Failed handling answer');
            }
        };

        const handleIce = async (payload: { candidate: RTCIceCandidateInit; from: string }) => {
            try {
                const pc = ensurePeer();
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch {
                // Ignore ICE timing errors
            }
        };

        socket.on('connect', handleConnect);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIce);

        if (socket.connected && roomRef.current) {
            socket.emit('join', roomRef.current);
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIce);
        };
    }, [attachLocalMedia, ensurePeer, socket]);

    const joinRoom = useCallback(
        (roomId: string) => {
            roomRef.current = roomId;
            socket?.emit('join', roomId);
        },
        [socket],
    );

    const leaveRoom = useCallback(() => {
        roomRef.current = null;
    }, []);

    const startCall = useCallback(async () => {
        try {
            await attachLocalMedia();
            const pc = ensurePeer();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (roomRef.current) {
                const currentSocket = useCanvasStore.getState().socket;
                currentSocket?.emit('offer', { room: roomRef.current, sdp: offer });
            }
        } catch (e: any) {
            setError(e?.message || 'Failed to start call');
        }
    }, [attachLocalMedia, ensurePeer]);

    const endCall = useCallback(() => {
        pcRef.current?.getSenders().forEach((s) => pcRef.current?.removeTrack(s));
        pcRef.current?.close();
        pcRef.current = null;
        setRemoteStream(null);
        setIsConnected(false);
    }, []);

    const toggleMic = useCallback(() => {
        const tracks = localStream?.getAudioTracks() || [];
        const next = !tracks[0]?.enabled;
        tracks.forEach((t) => (t.enabled = next));
        setIsMuted(!next);
    }, [localStream]);

    const toggleCamera = useCallback(() => {
        const tracks = localStream?.getVideoTracks() || [];
        const next = !tracks[0]?.enabled;
        tracks.forEach((t) => (t.enabled = next));
        setIsCameraOff(!next);
    }, [localStream]);

    return {
        localStream,
        remoteStream,
        isConnected,
        isMuted,
        isCameraOff,
        error,
        joinRoom,
        leaveRoom,
        startCall,
        endCall,
        toggleMic,
        toggleCamera,
        onRemoteStream,
        onConnectionStateChange,
    };
};
