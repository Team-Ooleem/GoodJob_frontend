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
    const [isMuted, setIsMuted] = useState(true);
    const isMutedRef = useRef(isMuted);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isRemoteMuted, setIsRemoteMuted] = useState(true);
    const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 🆕 Canvas Store의 isRecording 상태를 직접 사용 (단일 소스)
    const isRecording = useCanvasStore((s) => s.isRecording);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const pushToTalkStateRef = useRef({ active: false, wasMutedBeforePress: true });

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

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

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
            const state = pc.connectionState;
            console.log(`🔗 WebRTC 연결 상태: ${state}`);

            if (state === 'connected') {
                // P2P 연결 완료 시 하울링 방지 설정 강화
                console.log('✅ P2P 연결 완료 - 하울링 방지 설정 강화');

                // 로컬 스트림의 오디오 트랙에 추가 제약 조건 적용
                if (localStream) {
                    localStream.getAudioTracks().forEach((track) => {
                        track
                            .applyConstraints({
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: true,
                                volume: 0.7,
                            })
                            .catch((err) => {
                                console.warn('오디오 제약 조건 적용 실패:', err);
                            });
                    });
                }

                // 원격 스트림도 하울링 방지 설정 적용
                if (remoteStream) {
                    const audioElement = document.querySelector('audio') as HTMLAudioElement;
                    if (audioElement) {
                        audioElement.volume = 0.7; // 원격 오디오 볼륨 조절
                        console.log('🔊 원격 오디오 볼륨 0.7로 설정');
                    }
                }
            }

            setIsConnected(state === 'connected');
            onConnectionStateChange?.(state);
        };

        pcRef.current = pc;
        return pc;
    }, [onConnectionStateChange, onRemoteStream, setupDataChannelEvents]);

    const attachLocalMedia = useCallback(async () => {
        if (localStream) return localStream;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    // 하울링 방지 설정
                    echoCancellation: true, // 에코 캔슬레이션
                    noiseSuppression: true, // 노이즈 억제
                    autoGainControl: true, // 자동 게인 제어
                    sampleRate: 44100, // 샘플레이트
                    channelCount: 1, // 모노 채널
                    latency: 0.01, // 낮은 지연시간
                    volume: 0.7, // 볼륨 조절
                    // Google Chrome 전용 하울링 방지 설정 (타입 캐스팅)
                    ...({
                        googEchoCancellation: true,
                        googAutoGainControl: true,
                        googNoiseSuppression: true,
                        googHighpassFilter: true, // 하울링 방지 핵심!
                        googTypingNoiseDetection: true,
                        googAudioMirroring: false,
                    } as any),
                },
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            });

            const shouldEnableAudio = !isMuted;
            stream.getAudioTracks().forEach((track) => {
                track.enabled = shouldEnableAudio;
            });

            setLocalStream(stream);
            const pc = ensurePeer();
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            return stream;
        } catch (e: any) {
            setError(e?.message || 'Failed to get user media');
            throw e;
        }
    }, [ensurePeer, isMuted, localStream]);

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

    const setMicTrackState = useCallback(
        (shouldEnable: boolean) => {
            const tracks = localStream?.getAudioTracks() || [];
            tracks.forEach((track) => {
                if (track.enabled !== shouldEnable) {
                    track.enabled = shouldEnable;
                }
            });

            const nextMuted = !shouldEnable;
            if (isMutedRef.current !== nextMuted) {
                isMutedRef.current = nextMuted;
                setIsMuted(nextMuted);
                sendMuteStatus(nextMuted);
            }
        },
        [localStream, sendMuteStatus],
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

            setCanvasId(roomId);
            socket.emit('joinRtc', { room: roomId }, (count: number) => {
                console.log(` joinRtc: ${roomId}, 현재 인원 ${count}`);
            });
        },
        [socket],
    );
    /* 두명 연결 완료시 녹화 시작 이벤트 추가 */
    useEffect(() => {
        if (!socket) return;

        socket.on('startRecording', (data) => {
            console.log('두명 연결 완료시 녹화 시작 이벤트 수신', data);

            // 🆕 녹화 담당자만 실제 녹화 시작
            if (data.isRecorder) {
                console.log('🎥 녹화 담당자로 지정됨 - 녹화 시작');
                // startRecording();
            } else {
                console.log('👥 참관자로 지정됨 - 녹화 안 함');
                // UI에서 "녹화 중" 표시만 하고 실제 녹화는 안 함
            }
        });

        // 🆕 녹화 종료 이벤트 추가
        socket.on('stopRecording', (data) => {
            console.log('🛑 녹화 종료 이벤트 수신:', data.reason);
            // stopRecording(); // 모든 사용자가 녹화 종료
        });

        return () => {
            socket.off('startRecording');
            socket.off('stopRecording'); // 🆕 정리
        };
    }, [socket]);

    /* 세션 나갈 때 녹음 중지 */
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

        const currentEnabled = tracks[0]?.enabled ?? !isMuted;
        const nextEnabled = !currentEnabled;

        setMicTrackState(nextEnabled);

        console.log(
            `🎤 마이크 ${nextEnabled ? '켜짐' : '꺼짐'}, 상태 전송: isMuted=${!nextEnabled}`,
        );
    }, [isMuted, localStream, setMicTrackState]);

    useEffect(() => {
        const isTypingTarget = (target: EventTarget | null) => {
            if (!(target instanceof HTMLElement)) return false;
            const tag = target.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
        };

        const releasePushToTalk = () => {
            if (!pushToTalkStateRef.current.active) return;

            const shouldRemute = pushToTalkStateRef.current.wasMutedBeforePress;
            pushToTalkStateRef.current.active = false;
            pushToTalkStateRef.current.wasMutedBeforePress = true;

            if (shouldRemute) {
                setMicTrackState(false);
            }
        };

        const isPushToTalkKey = (key: string) => key === 't' || key === 'T' || key === 'ㅅ';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isPushToTalkKey(event.key)) return;
            if (event.repeat) return;
            if (isTypingTarget(event.target)) return;
            if (pushToTalkStateRef.current.active) return;

            pushToTalkStateRef.current.active = true;
            pushToTalkStateRef.current.wasMutedBeforePress = isMutedRef.current;

            if (isMutedRef.current) {
                setMicTrackState(true);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!isPushToTalkKey(event.key)) return;
            releasePushToTalk();
        };

        const handleVisibilityLoss = () => {
            releasePushToTalk();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleVisibilityLoss);
        document.addEventListener('visibilitychange', handleVisibilityLoss);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleVisibilityLoss);
            document.removeEventListener('visibilitychange', handleVisibilityLoss);
        };
    }, [setMicTrackState]);

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
