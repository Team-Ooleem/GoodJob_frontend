'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../_stores';
import { useVoiceDetection } from './useVoiceDetection';

export interface UseWebRTC {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;

    isConnected: boolean;
    isMuted: boolean;
    isCameraOff: boolean;
    error: string | null;

    // 음성 감지 관련
    isLocalSpeaking: boolean;
    isRemoteSpeaking: boolean;
    localVolumeLevel: number;

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

    // 음성 감지 상태
    const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);

    const onRemoteStream = options?.onRemoteStream;
    const onConnectionStateChange = options?.onConnectionStateChange;

    // 로컬 스트림에 대한 음성 감지
    const { isSpeaking: isLocalSpeaking, volumeLevel: localVolumeLevel } = useVoiceDetection(
        localStream,
        {
            threshold: 0.05, // 음성 감지 임계값 (0.01 → 0.02로 증가)
            smoothingFactor: 0.8, // 스무딩 팩터
            minSpeakingDuration: 100, // 최소 말하기 지속 시간 (ms)
            debounceDelay: 50, // 디바운스 지연 시간 (ms)
        },
    );

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
            setRemoteStream(stream);
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
            setLocalStream(stream);
            const pc = ensurePeer();
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            return stream;
        } catch (e: any) {
            setError(e?.message || 'Failed to get user media');
            throw e;
        }
    }, [ensurePeer, localStream]);

    // --- Socket listeners ---
    useEffect(() => {
        if (!socket) return;

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
                // ignore
            }
        };

        const handleReady = async () => {
            console.log('✅ ready 이벤트 수신 → startCall 실행');
            await startCall();
        };

        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIce);
        socket.on('ready', handleReady);

        return () => {
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIce);
            socket.off('ready', handleReady);
        };
    }, [attachLocalMedia, ensurePeer, socket]);

    // --- joinRoom ---
    const joinRoom = useCallback(
        (roomId: string) => {
            roomRef.current = roomId;
            if (!socket) return;

            socket.emit('joinRtc', { room: roomId }, (count: number) => {
                console.log(`🟢 joinRtc: ${roomId}, 현재 인원 ${count}`);
                if (count === 1) {
                    console.log('🟡 방에 혼자 있음 → 다른 참가자 기다림');
                }
            });
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
        // 음성 감지 관련
        isLocalSpeaking,
        isRemoteSpeaking,
        localVolumeLevel,
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
