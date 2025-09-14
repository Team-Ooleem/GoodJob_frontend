'use client';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useUserStore } from '@/stores/user-store';
import { useCanvasStore } from '../_stores';

// 전역 상태 관리
interface VoiceRecorderState {
    mediaRecorder: MediaRecorder | null;
    audioChunks: Blob[];
    stream: MediaStream | null;
    canvasIdx: string;
    webrtcStreams: {
        localStream: MediaStream | null;
        remoteStream: MediaStream | null;
    };
    logFlags: {
        streamCreated: boolean;
        formatSelected: boolean;
        sttProcessed: boolean;
        recordingStarted: boolean;
        recordingStopped: boolean;
        alreadyRecording: boolean;
        participantsError: boolean;
        fallbackWarning: boolean;
        directMic: boolean;
        durationCalculated: boolean;
        durationFailed: boolean;
        sttCompleted: boolean;
        sttFailed: boolean;
        micAccessFailed: boolean;
    };
}

// 전역 상태 관리
const globalState: VoiceRecorderState = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    canvasIdx: 'default-canvas-uuid',
    webrtcStreams: {
        localStream: null,
        remoteStream: null,
    },
    logFlags: {
        streamCreated: false,
        formatSelected: false,
        sttProcessed: false,
        recordingStarted: false,
        recordingStopped: false,
        alreadyRecording: false,
        participantsError: false,
        fallbackWarning: false,
        directMic: false,
        durationCalculated: false,
        durationFailed: false,
        sttCompleted: false,
        sttFailed: false,
        micAccessFailed: false,
    },
};

// 로그 시스템
const logOnce = (
    key: keyof VoiceRecorderState['logFlags'],
    message: string,
    level: 'log' | 'warn' | 'error' = 'log',
) => {
    if (!globalState.logFlags[key]) {
        console[level](message);
        globalState.logFlags[key] = true;
    }
};

// 캐시된 함수들
const memoizedFunctions = {
    getCanvasParticipants: null as ((canvasId: string) => Promise<any>) | null,
    createRecordingStream: null as (() => Promise<MediaStream>) | null,
    selectAudioFormat: null as (() => { selectedType: string; mimeType: string }) | null,
    calculateDuration: null as ((audioBlob: Blob, mimeType: string) => Promise<number>) | null,
};

/** canvas IDX 설정 함수 */
export const setCanvasIdx = (id: string) => {
    globalState.canvasIdx = id;
};

/** WebRTC 스트림 설정 함수 */
export const setWebRTCStreams = (
    localStream: MediaStream | null,
    remoteStream: MediaStream | null,
) => {
    globalState.webrtcStreams = { localStream, remoteStream };
};

/**canvas 참여자 정보 가져오기 */
const getCanvasParticipants = async (canvasId: string) => {
    if (!memoizedFunctions.getCanvasParticipants) {
        memoizedFunctions.getCanvasParticipants = async (canvasId: string) => {
            try {
                const response = await axios.get(`${API_BASE_URL}/canvas/${canvasId}/participants`);
                return response.data;
            } catch (error) {
                logOnce('participantsError', '캔버스 참여자 정보 가져오기 실패', 'error');
                return null;
            }
        };
    }
    return memoizedFunctions.getCanvasParticipants(canvasId);
};

/**스트림 생성 함수 */
const createRecordingStream = async (): Promise<MediaStream> => {
    if (!memoizedFunctions.createRecordingStream) {
        memoizedFunctions.createRecordingStream = async (): Promise<MediaStream> => {
            const { localStream, remoteStream } = globalState.webrtcStreams;

            if (localStream || remoteStream) {
                logOnce('streamCreated', '️ WebRTC 스트림으로 녹음 시작');

                const combinedStream = new MediaStream();

                if (localStream) {
                    const localAudioTracks = localStream.getAudioTracks();
                    localAudioTracks.forEach((track) => combinedStream.addTrack(track));
                }

                if (remoteStream) {
                    const remoteAudioTracks = remoteStream.getAudioTracks();
                    remoteAudioTracks.forEach((track) => combinedStream.addTrack(track));
                }

                if (combinedStream.getAudioTracks().length === 0) {
                    logOnce(
                        'fallbackWarning',
                        'WebRTC 스트림에 오디오 트랙이 없습니다. 마이크로 fallback',
                        'warn',
                    );
                    return await navigator.mediaDevices.getUserMedia({ audio: true });
                }

                return combinedStream;
            } else {
                logOnce('directMic', '🎙️ 마이크로 직접 녹음 시작');
                return await navigator.mediaDevices.getUserMedia({ audio: true });
            }
        };
    }
    return memoizedFunctions.createRecordingStream();
};

/** 오디오 포맷 선택 함수 */
const selectAudioFormat = () => {
    if (!memoizedFunctions.selectAudioFormat) {
        memoizedFunctions.selectAudioFormat = () => {
            let selectedType = 'audio/mp4';
            let mimeType = 'audio/mp4';

            if (!MediaRecorder.isTypeSupported('audio/mp4')) {
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    selectedType = 'audio/webm;codecs=opus';
                    mimeType = 'audio/webm';
                } else {
                    selectedType = 'audio/webm';
                    mimeType = 'audio/webm';
                }
            }

            logOnce('formatSelected', `선택된 오디오 포맷: ${selectedType}`);
            return { selectedType, mimeType };
        };
    }
    return memoizedFunctions.selectAudioFormat();
};

/** Duration 계산 함수 */
const calculateDuration = async (audioBlob: Blob, mimeType: string): Promise<number> => {
    if (!memoizedFunctions.calculateDuration) {
        memoizedFunctions.calculateDuration = async (
            audioBlob: Blob,
            mimeType: string,
        ): Promise<number> => {
            const blobSizeKB = audioBlob.size / 1024;
            let duration: number;

            // 기본 추정값
            if (mimeType === 'audio/mp4') {
                duration = Math.max(3, Math.min(30, blobSizeKB * 0.08));
            } else if (mimeType === 'audio/mp3') {
                duration = Math.max(3, Math.min(30, blobSizeKB * 0.08));
            } else {
                duration = Math.max(3, Math.min(30, blobSizeKB * 0.1));
            }

            // 정확한 duration 계산 시도
            try {
                const audio = new Audio();
                const url = URL.createObjectURL(audioBlob);

                await new Promise<void>((resolve) => {
                    audio.addEventListener('loadedmetadata', () => {
                        URL.revokeObjectURL(url);
                        if (audio.duration && isFinite(audio.duration)) {
                            duration = audio.duration;
                            logOnce('durationCalculated', `정확한 duration: ${duration}초`);
                        }
                        resolve();
                    });

                    audio.addEventListener('error', () => {
                        URL.revokeObjectURL(url);
                        logOnce('durationFailed', 'Audio duration 계산 실패, 추정값 사용', 'warn');
                        resolve();
                    });

                    audio.src = url;
                });
            } catch (error) {
                logOnce('durationFailed', 'Audio duration 계산 실패, 추정값 사용', 'warn');
            }

            return duration;
        };
    }
    return memoizedFunctions.calculateDuration(audioBlob, mimeType);
};

/**STT 처리 함수 */
const processSTT = async (audioBlob: Blob, mimeType: string) => {
    try {
        // Canvas 참여자 정보 가져오기
        const participants = await getCanvasParticipants(globalState.canvasIdx);

        let mentorIdx: number;
        let menteeIdx: number;

        if (!participants || participants.length < 2) {
            logOnce('participantsError', 'Canvas 참여자 조회 실패, 기본값 사용', 'warn');
            mentorIdx = 1;
            menteeIdx = 2;
        } else {
            const currentUser = useUserStore.getState().user;

            if (currentUser && currentUser.idx) {
                menteeIdx = currentUser.idx;
                const mentor = participants.find((p: any) => p.user_id !== currentUser.idx);
                mentorIdx = mentor ? mentor.user_id : participants[0].user_id;
            } else {
                mentorIdx = participants[0].user_id;
                menteeIdx = participants[1].user_id;
            }
        }

        // Base64 변환
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });

        // Duration 계산
        const duration = await calculateDuration(audioBlob, mimeType);

        const requestData = {
            audioData: base64Data,
            mimeType: mimeType,
            canvasId: globalState.canvasIdx,
            mentorIdx: mentorIdx,
            menteeIdx: menteeIdx,
            isFinalChunk: true,
            chunkIndex: 0,
            totalChunks: 1,
            duration: duration,
        };

        logOnce('sttProcessed', '🎵 녹음 완료 - STT 처리 시작');
        await axios.post(`${API_BASE_URL}/stt/transcribe-with-context`, requestData);
        logOnce('sttCompleted', '✅ STT 처리 완료');
    } catch (err) {
        logOnce('sttFailed', 'STT 또는 DB 처리 실패', 'error');
    }
};

/**스트림 정리 함수 */
const cleanupStream = () => {
    if (globalState.stream) {
        // WebRTC 스트림이 아닌 경우에만 트랙 중지
        const { localStream, remoteStream } = globalState.webrtcStreams;
        const isWebRTCStream =
            globalState.stream === localStream || globalState.stream === remoteStream;

        if (!isWebRTCStream) {
            globalState.stream.getTracks().forEach((track) => track.stop());
        }
        globalState.stream = null;
    }

    globalState.mediaRecorder = null;
    globalState.audioChunks = [];
};

/**녹음 시작 함수 */
export const startRecording = async () => {
    // Canvas Store의 상태를 확인 (단일 소스)
    const canvasStore = useCanvasStore.getState();
    if (canvasStore.isRecording) {
        logOnce('alreadyRecording', '이미 녹음 중입니다.');
        return;
    }

    try {
        const stream = await createRecordingStream();
        const { selectedType, mimeType } = selectAudioFormat();

        globalState.stream = stream;
        globalState.mediaRecorder = new MediaRecorder(stream, { mimeType: selectedType });
        globalState.audioChunks = [];

        canvasStore.setRecording(true);

        globalState.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                globalState.audioChunks.push(event.data);
            }
        };

        globalState.mediaRecorder.onstop = async () => {
            logOnce('recordingStopped', ' 녹음 중지됨 - STT 처리 시작');
            const audioBlob = new Blob(globalState.audioChunks, { type: selectedType });
            await processSTT(audioBlob, mimeType);

            const canvasStore = useCanvasStore.getState();
            canvasStore.setRecording(false);

            cleanupStream();
        };

        globalState.mediaRecorder.start();
        logOnce('recordingStarted', '🎙️ 녹음 시작됨');
    } catch (err) {
        logOnce('micAccessFailed', '마이크 접근 실패', 'error');
        cleanupStream();
    }
};

/**녹음 상태 확인 함수 */
export const stopRecording = () => {
    if (globalState.mediaRecorder?.state === 'recording') {
        globalState.mediaRecorder.stop();
        // onstop 이벤트에서 상태 업데이트됨
    } else {
        // 즉시 상태 업데이트
        const canvasStore = useCanvasStore.getState();
        canvasStore.setRecording(false);
        cleanupStream();
    }
};

export const isRecording = () => {
    // Canvas Store의 상태를 반환 (단일 소스)
    const canvasStore = useCanvasStore.getState();
    return canvasStore.isRecording;
};
