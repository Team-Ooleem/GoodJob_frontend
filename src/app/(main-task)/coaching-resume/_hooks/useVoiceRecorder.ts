'use client';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useUserStore } from '@/stores/user-store';
import { useCanvasStore } from '../_stores';
import { VoiceRecorderState } from '@/apis/recoding-api';
import { WavRecorder } from '@/utils/audio/WavRecorder';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

const CHUNK_DURATION = 300000; // 300초마다 청크 생성
let chunkIndex = 0;
let totalChunks = 0; // ✅ 이 줄 추가
let cumulativeTime = 0;

// 전역 상태 관리
const globalState: VoiceRecorderState = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    canvasId: 'resume-room',
    wavRecorder: new WavRecorder(),
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

//useVoiceRecorder 훅
export const useVoiceRecorder = (sessionId?: string) => {
    const params = useParams<{ sessionId: string }>();
    const currentSessionId = sessionId || params.sessionId;

    useEffect(() => {
        if (currentSessionId) {
            setCanvasId(currentSessionId);
        }
    }, [currentSessionId]);

    return {
        isRecording: isRecording(),
        startRecording,
        stopRecording,
        canvasId: currentSessionId,
    };
};

// canvas ID 설정 함수 (하나만)
export const setCanvasId = (id: string) => {
    globalState.canvasId = id;
};

export const setWebRTCStreams = (
    localStream: MediaStream | null,
    remoteStream: MediaStream | null,
) => {
    globalState.webrtcStreams = { localStream, remoteStream };
};

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

/** Duration 계산 함수 (WAV 전용) */
const calculateDuration = async (audioBlob: Blob, mimeType: string): Promise<number> => {
    if (!memoizedFunctions.calculateDuration) {
        memoizedFunctions.calculateDuration = async (
            audioBlob: Blob,
            mimeType: string,
        ): Promise<number> => {
            // WAV의 경우 더 정확한 계산
            const blobSizeKB = audioBlob.size / 1024;
            let duration = Math.max(3, Math.min(60, blobSizeKB * 0.12)); // WAV는 더 큰 용량

            // 정확한 duration 계산 시도
            try {
                const audio = new Audio();
                const url = URL.createObjectURL(audioBlob);

                await new Promise<void>((resolve) => {
                    const timeoutId = setTimeout(() => {
                        URL.revokeObjectURL(url);
                        resolve();
                    }, 3000);

                    audio.addEventListener('loadedmetadata', () => {
                        clearTimeout(timeoutId);
                        URL.revokeObjectURL(url);
                        if (audio.duration && isFinite(audio.duration)) {
                            duration = audio.duration;
                        }
                        resolve();
                    });

                    audio.addEventListener('error', () => {
                        clearTimeout(timeoutId);
                        URL.revokeObjectURL(url);
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
        const participants = await getCanvasParticipants(globalState.canvasId);

        let mentorIdx: number;
        let menteeIdx: number;

        if (!participants || participants.length < 2) {
            logOnce('participantsError', 'Canvas 참여자 조회 실패, 기본값 사용', 'warn');
            mentorIdx = 1;
            menteeIdx = 2;
        } else {
            const mentor = participants.find((p: any) => p.mentor_idx && p.is_approved === 1);
            const mentee = participants.find((p: any) => !p.mentor_idx || p.is_approved !== 1);

            if (mentor && mentee) {
                mentorIdx = mentor.user_id;
                menteeIdx = mentee.user_id;
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
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });

        // 크기 검증
        if (base64Data.length === 0 && !isFinal) {
            return;
        }

        // Duration 계산
        const duration = await calculateDuration(audioBlob, mimeType);

        const chunkStartTime = cumulativeTime;
        const chunkEndTime = cumulativeTime + duration;

        // 🔧 누적 시간 업데이트 (최종 청크가 아닐 때만)
        if (!isFinal) {
            cumulativeTime += duration;
        }

        const requestData = {
            audioData: base64Data,
            mimeType: mimeType,
            canvasId: globalState.canvasId,
            mentorIdx: mentorIdx,
            menteeIdx: menteeIdx,
            isFinalChunk: isFinal,
            chunkIndex: currentChunkIndex,
            totalChunks: isFinal ? totalChunks : -1,
            duration: duration,
            isNewRecordingSession: false, // 🔧 항상 false로 설정 (같은 세션 연속)
            usePynoteDiarization: true,
            processInBackground: true,
            ensureTimeSync: true,
            useExistingTimeValidation: true,
            chunkStartTime: chunkStartTime,
            chunkEndTime: chunkEndTime,
        };
        // 백그라운드에서 비동기 처리
        axios
            .post(`${API_BASE_URL}/stt/transcribe-with-context`, requestData)
            .catch((error) => console.error(`청크 ${currentChunkIndex} 처리 실패:`, error));

        console.log(`✅ 청크 ${currentChunkIndex} WAV 직접 처리 완료`);
    } catch (err) {
        logOnce(
            `sttChunk${currentChunkIndex}Failed`,
            `❌ 청크 ${currentChunkIndex} 처리 실패`,
            'error',
        );
    }
};

export const startRecording = async () => {
    // Canvas Store의 실제 녹음 상태 확인
    const canvasStore = useCanvasStore.getState();
    if (canvasStore.isRecording) {
        logOnce('alreadyRecording', '이미 녹음 중입니다.');
        return;
    }

    try {
        // 🆕 WebRTC 스트림 확인
        const { localStream, remoteStream } = globalState.webrtcStreams;

        console.log('🎙️ 녹화 시작 시도');
        console.log('️ 로컬 스트림:', localStream ? '있음' : '없음');
        console.log('️ 원격 스트림:', remoteStream ? '있음' : '없음');
        console.log('�� canvasId 확인:', globalState.canvasId);

        // WebRTC 스트림을 녹화기에 전달
        globalState.wavRecorder.setWebRTCStreams(localStream, remoteStream);

        // WavRecorder 콜백 설정
        globalState.wavRecorder.setChunkCallback(async (wavBlob: Blob) => {
            console.log(`🎵 청크 ${chunkIndex} 생성됨 - 크기: ${wavBlob.size} bytes`);
            await processSTTChunk(wavBlob, 'audio/wav', chunkIndex, false);
            chunkIndex++;
        });

        await globalState.wavRecorder.webRTCStart();
        console.log('️ WebRTC 스트림으로 녹화 시작');

        // 🔧 한 번만 초기화 (재녹음 시에만)
        if (chunkIndex === 0) {
            totalChunks = 0;
            cumulativeTime = 0;
            console.log(`🆕 새 세션으로 초기화 - canvasId: ${globalState.canvasId}`);
        } else {
            console.log(`🔄 세션 재시작 - chunkIndex: ${chunkIndex}`);
        }

        // Canvas Store 상태 업데이트
        canvasStore.setRecording(true);
        globalState.logFlags.recordingStarted = true;

        logOnce('recordingStarted', '🎙️ WAV 직접 녹음 시작됨 (16000Hz)');
    } catch (err) {
        logOnce('micAccessFailed', '마이크 접근 실패', 'error');
        // recordingStopped 플래그 리셋은 불필요
    }
};

/**녹음 상태 확인 함수 */
export const stopRecording = async () => {
    const canvasStore = useCanvasStore.getState();
    if (!canvasStore.isRecording) {
        logOnce('notRecording', '녹음 중이 아닙니다.');
        return;
    }

    try {
        console.log('🎙️ 녹화 종료 시도');

        // WavRecorder로 녹음 중지
        await globalState.wavRecorder.webRTCStop();
        console.log('✅ WebRTC 스트림 녹화 종료');

        // 🔧 최종 청크 신호 전송 (중요!)
        console.log('📤 최종 청크 신호 전송 중...');
        await processSTTChunk(
            new Blob([], { type: 'audio/wav' }),
            'audio/wav',
            chunkIndex,
            true, // �� isFinal = true
        );
        console.log('✅ 최종 청크 신호 전송 완료');

        // Canvas Store 상태 업데이트
        canvasStore.setRecording(false);
        globalState.logFlags.recordingStopped = true;

        logOnce('recordingStopped', '🎙️ 녹음 종료됨');
    } catch (err) {
        console.error('녹음 종료 실패:', err);
        // 에러 발생 시에도 상태는 업데이트
        canvasStore.setRecording(false);
    }
};

export const isRecording = () => {
    // Canvas Store의 상태를 반환 (단일 소스)
    const canvasStore = useCanvasStore.getState();
    return canvasStore.isRecording;
};
