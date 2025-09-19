'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../_stores';
import { useVoiceDetection } from './useVoiceDetection';
import { setCanvasId, setWebRTCStreams, startRecording, stopRecording } from './useVoiceRecorder';
import { start } from 'repl';

export interface UseWebRTC {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isConnected: boolean;
    isMuted: boolean;
    isCameraOff: boolean;
    isRemoteMuted: boolean;
    isRemoteCameraOff: boolean;
    error: string | null;
    isLocalSpeaking: boolean;
    isRemoteSpeaking: boolean;
    localVolumeLevel: number;
    remoteVolumeLevel: number;
    isRecording: boolean;
    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
    startCall: () => Promise<void>;
    endCall: () => void;
    toggleMic: () => void;
    toggleCamera: () => void;
    toggleRecording: () => void;
    sendRecordingStatus: (isRecording: boolean) => void;
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
    const [isRemoteMuted, setIsRemoteMuted] = useState(false);
    const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🆕 Canvas Store의 isRecording 상태를 직접 사용 (단일 소스)
    const isRecording = useCanvasStore((s) => s.isRecording);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);

    const onRemoteStream = options?.onRemoteStream;
    const onConnectionStateChange = options?.onConnectionStateChange;

    //로그 플래그로 중복 방지
    const logFlags = useRef({
        dataChannelConnected: false,
        recordingStatusReceived: false,
        messageParseError: false,
        readyEventReceived: false,
        joinRtcLogged: false,
        leaveRoomLogged: false,
        endCallLogged: false,
    });

    // 🆕 WebRTC 스트림을 useVoiceRecorder에 전달
    useEffect(() => {
        setWebRTCStreams(localStream, remoteStream);
    }, [localStream, remoteStream]);

    //DataChannel 이벤트 리스너 설정 함수
    const setupDataChannelEvents = useCallback((dataChannel: RTCDataChannel) => {
        // 이미 이벤트 리스너가 등록되어 있으면 스킵
        if (dataChannel.onopen) return;

        dataChannel.onopen = () => {
            if (!logFlags.current.dataChannelConnected) {
                console.log('📡 WebRTC DataChannel 연결됨');
                logFlags.current.dataChannelConnected = true;
            }
        };

        dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'recordingStatus') {
                    if (!logFlags.current.recordingStatusReceived) {
                        console.log(`🎤 녹음 상태 변경: ${data.isRecording ? '시작' : '중지'}`);
                        logFlags.current.recordingStatusReceived = true;
                    }
                } else if (data.type === 'muteStatus') {
                    setIsRemoteMuted(data.isMuted);
                    console.log(
                        `🔊 상대방 마이크 상태: ${data.isMuted ? '음소거' : '음소거 해제'}`,
                    );
                } else if (data.type === 'cameraStatus') {
                    setIsRemoteCameraOff(data.isCameraOff);
                    console.log(`📹 상대방 카메라 상태: ${data.isCameraOff ? '꺼짐' : '켜짐'}`);
                }
            } catch (error) {
                if (!logFlags.current.messageParseError) {
                    console.error('DataChannel 메시지 파싱 오류:', error);
                    logFlags.current.messageParseError = true;
                }
            }
        };
    }, []);

    // 로컬 스트림에 대한 음성 감지
    const { isSpeaking: isLocalSpeaking, volumeLevel: localVolumeLevel } = useVoiceDetection(
        localStream,
        {
            threshold: 0.05,
            smoothingFactor: 0.8,
            minSpeakingDuration: 100,
            debounceDelay: 50,
        },
    );

    // 원격 스트림에 대한 음성 감지
    const { isSpeaking: isRemoteSpeaking, volumeLevel: remoteVolumeLevel } = useVoiceDetection(
        remoteStream,
        {
            threshold: 0.05,
            smoothingFactor: 0.8,
            minSpeakingDuration: 100,
            debounceDelay: 50,
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

        //DataChannel이 이미 있는지 확인
        if (!dataChannelRef.current) {
            const dataChannel = pc.createDataChannel('recordingStatus', {
                ordered: true,
            });
            dataChannelRef.current = dataChannel;

            // 이벤트 리스너 한 번만 등록
            setupDataChannelEvents(dataChannel);
        }

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

        // DataChannel 수신 처리
        pc.ondatachannel = (event) => {
            const channel = event.channel;

            // 이미 이벤트 리스너가 등록되어 있으면 스킵
            if (channel.onmessage) return;

            channel.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'recordingStatus') {
                        if (!logFlags.current.recordingStatusReceived) {
                            console.log(`🎤 녹음 상태 변경: ${data.isRecording ? '시작' : '중지'}`);
                            logFlags.current.recordingStatusReceived = true;
                        }
                    } else if (data.type === 'muteStatus') {
                        setIsRemoteMuted(data.isMuted);
                        console.log(
                            `🔊 상대방 마이크 상태: ${data.isMuted ? '음소거' : '음소거 해제'}`,
                        );
                    } else if (data.type === 'cameraStatus') {
                        setIsRemoteCameraOff(data.isCameraOff);
                        console.log(`📹 상대방 카메라 상태: ${data.isCameraOff ? '꺼짐' : '켜짐'}`);
                    }
                } catch (error) {
                    if (!logFlags.current.messageParseError) {
                        console.error('DataChannel 메시지 파싱 오류:', error);
                        logFlags.current.messageParseError = true;
                    }
                }
            };
        };

        pc.onconnectionstatechange = () => {
            setIsConnected(pc.connectionState === 'connected');
            onConnectionStateChange?.(pc.connectionState);
        };

        pcRef.current = pc;
        return pc;
    }, [onConnectionStateChange, onRemoteStream, setupDataChannelEvents]);

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

    const sendMuteStatus = useCallback(
        (isMuted: boolean) => {
            const dataChannel = dataChannelRef.current;

            if (!isConnected) {
                console.log(
                    `🔧 [로컬 모드] WebRTC 연결 없음 - 마이크 상태: ${isMuted ? '음소거' : '음소거 해제'}`,
                );
                return;
            }

            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(
                    JSON.stringify({
                        type: 'muteStatus',
                        isMuted,
                        timestamp: Date.now(),
                    }),
                );
                console.log(`📡 WebRTC로 마이크 상태 전송: ${isMuted ? '음소거' : '음소거 해제'}`);
            } else {
                console.warn('DataChannel이 연결되지 않음 또는 준비되지 않음');
            }
        },
        [isConnected],
    );

    const sendCameraStatus = useCallback(
        (isCameraOff: boolean) => {
            const dataChannel = dataChannelRef.current;

            if (!isConnected) {
                console.log(
                    `🔧 [로컬 모드] WebRTC 연결 없음 - 카메라 상태: ${isCameraOff ? '꺼짐' : '켜짐'}`,
                );
                return;
            }

            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(
                    JSON.stringify({
                        type: 'cameraStatus',
                        isCameraOff,
                        timestamp: Date.now(),
                    }),
                );
                console.log(`📡 WebRTC로 카메라 상태 전송: ${isCameraOff ? '꺼짐' : '켜짐'}`);
            } else {
                console.warn('DataChannel이 연결되지 않음 또는 준비되지 않음');
            }
        },
        [isConnected],
    );

    //sendRecordingStatus
    const sendRecordingStatus = useCallback(
        (isRecording: boolean) => {
            const dataChannel = dataChannelRef.current;

            if (!isConnected) {
                if (!logFlags.current.recordingStatusReceived) {
                    console.log(
                        `🔧 [로컬 모드] WebRTC 연결 없음 - 녹음 상태: ${isRecording ? '시작' : '중지'}`,
                    );
                    logFlags.current.recordingStatusReceived = true;
                }
                return;
            }

            if (dataChannel && dataChannel.readyState === 'open') {
                dataChannel.send(
                    JSON.stringify({
                        type: 'recordingStatus',
                        isRecording,
                        timestamp: Date.now(),
                    }),
                );
                if (!logFlags.current.recordingStatusReceived) {
                    console.log(`📡 WebRTC로 녹음 상태 전송: ${isRecording ? '시작' : '중지'}`);
                    logFlags.current.recordingStatusReceived = true;
                }
            } else {
                if (!logFlags.current.messageParseError) {
                    console.warn('DataChannel이 연결되지 않음 또는 준비되지 않음');
                    logFlags.current.messageParseError = true;
                }
            }
        },
        [isConnected],
    );

    // 🆕 sendRecordingStatus 함수를 캔버스 스토어에 등록
    useEffect(() => {
        const setSendRecordingStatus = useCanvasStore.getState().setSendRecordingStatus;
        setSendRecordingStatus(sendRecordingStatus);
    }, [sendRecordingStatus]);

    // 🆕 WebRTC 상태와 Canvas Store 상태 동기화
    useEffect(() => {
        const canvasStore = useCanvasStore.getState();
        canvasStore.setMicEnabled(!isMuted);
        canvasStore.setCamEnabled(!isCameraOff);
    }, [isMuted, isCameraOff]);

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
            if (!logFlags.current.readyEventReceived) {
                console.log('✅ ready 이벤트 수신 → startCall 실행');
                logFlags.current.readyEventReceived = true;
            }
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

            //세션 진입시 바로 녹음 시작
            setCanvasId(roomId);
            const canvasStore = useCanvasStore.getState();
            startRecording();
            socket.emit('joinRtc', { room: roomId }, (count: number) => {
                console.log(` joinRtc: ${roomId}, 현재 인원 ${count}`);
            });
        },
        [socket],
    );
    const leaveRoom = useCallback(() => {
        roomRef.current = null;
        stopRecording();
        pcRef.current?.close();
        pcRef.current = null;
        setRemoteStream(null);
        setIsConnected(false);
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
        dataChannelRef.current = null;
    }, []);

    const toggleMic = useCallback(() => {
        const tracks = localStream?.getAudioTracks() || [];
        if (tracks.length === 0) {
            console.warn('오디오 트랙이 없습니다');
            return;
        }

        const currentEnabled = tracks[0]?.enabled;
        const nextEnabled = !currentEnabled;

        tracks.forEach((track) => {
            track.enabled = nextEnabled;
        });

        setIsMuted(!nextEnabled);
        sendMuteStatus(!nextEnabled);

        console.log(
            `🎤 마이크 ${nextEnabled ? '켜짐' : '꺼짐'}, 상태 전송: isMuted=${!nextEnabled}`,
        );
    }, [localStream, sendMuteStatus]);

    const toggleCamera = useCallback(() => {
        const tracks = localStream?.getVideoTracks() || [];
        const next = !tracks[0]?.enabled;
        tracks.forEach((t) => (t.enabled = next));
        setIsCameraOff(!next);
        sendCameraStatus(!next);

        console.log(`📹 카메라 ${next ? '켜짐' : '꺼짐'}, 상태 전송: isCameraOff=${!next}`);
    }, [localStream, sendCameraStatus]);

    // 🆕 WebRTC toggle 함수들을 캔버스 스토어에 등록
    useEffect(() => {
        const canvasStore = useCanvasStore.getState();
        canvasStore.setWebRTCToggleMic(toggleMic);
        canvasStore.setWebRTCToggleCamera(toggleCamera);
    }, [toggleMic, toggleCamera]);

    // �� DataChannel 정리 함수
    const cleanupDataChannel = useCallback(() => {
        if (dataChannelRef.current) {
            dataChannelRef.current.onopen = null;
            dataChannelRef.current.onmessage = null;
            dataChannelRef.current = null;
        }

        // 로그 플래그 리셋
        logFlags.current = {
            dataChannelConnected: false,
            recordingStatusReceived: false,
            messageParseError: false,
            readyEventReceived: false,
            joinRtcLogged: false,
            leaveRoomLogged: false,
            endCallLogged: false,
        };
    }, []);

    // �� 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            cleanupDataChannel();
        };
    }, [cleanupDataChannel]);

    // �� Canvas Store의 toggleRecording 사용
    const toggleRecording = useCanvasStore((s) => s.toggleRecording);

    return {
        localStream,
        remoteStream,
        isConnected,
        isMuted,
        isCameraOff,
        isRemoteMuted,
        isRemoteCameraOff,
        error,
        // 음성 감지 관련
        isLocalSpeaking,
        isRemoteSpeaking,
        localVolumeLevel,
        remoteVolumeLevel,
        joinRoom,
        leaveRoom,
        startCall,
        endCall,
        toggleMic,
        toggleCamera,
        onRemoteStream,
        onConnectionStateChange,

        // 🆕 녹음 관련 (Canvas Store 상태 반환)
        isRecording,
        toggleRecording,
        sendRecordingStatus,
    };
};
