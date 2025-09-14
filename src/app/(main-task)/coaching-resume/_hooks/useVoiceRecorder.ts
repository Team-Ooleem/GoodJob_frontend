'use client';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useUserStore } from '@/stores/user-store';
import { useCanvasStore } from '../_stores';
import { VoiceRecorderState } from '@/apis/recoding-api';

const CHUNK_DURATION = 300000; // 300초마다 청크 생성
let chunkIndex = 0;
let totalChunks = 0; // ✅ 이 줄 추가

// 전역 상태 관리
const globalState: VoiceRecorderState = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    canvasIdx: 'resume-room',
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

const processSTTChunk = async (
    audioBlob: Blob,
    mimeType: string,
    currentChunkIndex: number,
    isFinal: boolean,
) => {
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
            isFinalChunk: isFinal, // ✅ 실제 최종 청크 여부
            chunkIndex: currentChunkIndex, // ✅ 실제 청크 인덱스
            totalChunks: isFinal ? totalChunks : -1, // ✅ 최종 청크일 때만 총 청크 수
            duration: duration,
            isNewRecordingSession: currentChunkIndex === 0, // ✅ 첫 번째 청크
        };

        logOnce(`sttChunk${currentChunkIndex}`, `🎵 청크 ${currentChunkIndex} STT 처리 시작`);
        await axios.post(`${API_BASE_URL}/stt/transcribe-with-context`, requestData);
        logOnce(
            `sttChunk${currentChunkIndex}Complete`,
            `✅ 청크 ${currentChunkIndex} STT 처리 완료`,
        );
    } catch (err) {
        logOnce(
            `sttChunk${currentChunkIndex}Failed`,
            `❌ 청크 ${currentChunkIndex} STT 처리 실패`,
            'error',
        );
    }
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

    // ✅ 청크 카운터 초기화
    chunkIndex = 0;
    totalChunks = 0;
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

        // ✅ 청크 카운터 초기화
        chunkIndex = 0;
        totalChunks = 0;

        canvasStore.setRecording(true);

        // ✅ 청크별 실시간 STT 처리
        globalState.mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                globalState.audioChunks.push(event.data);

                // ✅ 청크별 즉시 STT 처리
                await processSTTChunk(event.data, mimeType, chunkIndex, false);
                chunkIndex++;
            }
        };

        // ✅ 최종 청크 처리
        globalState.mediaRecorder.onstop = async () => {
            logOnce('recordingStopped', '��️ 녹음 중지됨 - 최종 청크 처리 시작');

            // ✅ 최종 청크 처리
            if (globalState.audioChunks.length > 0) {
                const finalBlob = new Blob(globalState.audioChunks, { type: selectedType });
                await processSTTChunk(finalBlob, mimeType, chunkIndex, true);
            }

            totalChunks = chunkIndex + 1;
            const canvasStore = useCanvasStore.getState();
            canvasStore.setRecording(false);

            cleanupStream();
        };

        // ✅ 60초마다 청크 생성
        globalState.mediaRecorder.start(CHUNK_DURATION);
        logOnce('recordingStarted', '🎙️ 60초 청크 분할 녹음 시작됨');
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
