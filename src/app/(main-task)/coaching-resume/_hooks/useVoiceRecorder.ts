'use client';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useUserStore } from '@/stores/user-store';
import { useCanvasStore } from '../_stores';

// 전역 ref들
const mediaRecorderRef = { current: null as MediaRecorder | null };
const audioChunksRef = { current: [] as Blob[] };
const streamRef = { current: null as MediaStream | null };
const canvasIdxRef = { current: 'default-canvas-uuid' };

// WebRTC 스트림 저장용 ref
const webrtcStreamsRef = {
    current: {
        localStream: null as MediaStream | null,
        remoteStream: null as MediaStream | null,
    },
};

/** canvas IDX 설정 함수 */
export const setCanvasIdx = (id: string) => {
    canvasIdxRef.current = id;
};

/** WebRTC 스트림 설정 함수 */
export const setWebRTCStreams = (
    localStream: MediaStream | null,
    remoteStream: MediaStream | null,
) => {
    webrtcStreamsRef.current = { localStream, remoteStream };
};

/** canvas 참여자 정보 가져오기 */
const getCanvasParticipants = async (canvasId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/canvas/${canvasId}/participants`);
        return response.data;
    } catch (error) {
        console.error('캔버스 참여자 정보 가져오기 실패:', error);
        return null;
    }
};

/** 스트림 생성 함수 */
const createRecordingStream = async (): Promise<MediaStream> => {
    const { localStream, remoteStream } = webrtcStreamsRef.current;

    // WebRTC 스트림이 있으면 사용
    if (localStream || remoteStream) {
        console.log('️ WebRTC 스트림으로 녹음 시작');

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
            console.warn('WebRTC 스트림에 오디오 트랙이 없습니다. 마이크로 fallback');
            return await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        return combinedStream;
    } else {
        console.log('🎙️ 마이크로 직접 녹음 시작');
        return await navigator.mediaDevices.getUserMedia({ audio: true });
    }
};

/** 오디오 포맷 선택 함수 */
const selectAudioFormat = () => {
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

    console.log(`선택된 오디오 포맷: ${selectedType}`);
    return { selectedType, mimeType };
};

/** Duration 계산 함수 */
const calculateDuration = async (audioBlob: Blob, mimeType: string): Promise<number> => {
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
                    console.log(`정확한 duration: ${duration}초`);
                }
                resolve();
            });

            audio.addEventListener('error', () => {
                URL.revokeObjectURL(url);
                console.warn('Audio duration 계산 실패, 추정값 사용');
                resolve();
            });

            audio.src = url;
        });
    } catch (error) {
        console.warn('Audio duration 계산 실패, 추정값 사용:', error);
    }

    return duration;
};

/** STT 처리 함수 */
const processSTT = async (audioBlob: Blob, mimeType: string) => {
    try {
        // Canvas 참여자 정보 가져오기
        const participants = await getCanvasParticipants(canvasIdxRef.current);

        let mentorIdx: number;
        let menteeIdx: number;

        if (!participants || participants.length < 2) {
            console.warn('Canvas 참여자 조회 실패, 기본값 사용');
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
            canvasId: canvasIdxRef.current,
            mentorIdx: mentorIdx,
            menteeIdx: menteeIdx,
            isFinalChunk: true,
            chunkIndex: 0,
            totalChunks: 1,
            duration: duration,
        };

        console.log('🎵 녹음 완료 - STT 처리 시작');
        await axios.post(`${API_BASE_URL}/stt/transcribe-with-context`, requestData);
        console.log('✅ STT 처리 완료');
    } catch (err) {
        console.error('STT 또는 DB 처리 실패', err);
    }
};

/** 스트림 정리 함수 */
const cleanupStream = () => {
    if (streamRef.current) {
        // WebRTC 스트림이 아닌 경우에만 트랙 중지
        const { localStream, remoteStream } = webrtcStreamsRef.current;
        const isWebRTCStream =
            streamRef.current === localStream || streamRef.current === remoteStream;

        if (!isWebRTCStream) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        streamRef.current = null;
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
};

/**️ 녹음 시작 함수 */
export const startRecording = async () => {
    // Canvas Store의 상태를 확인 (단일 소스)
    const canvasStore = useCanvasStore.getState();
    if (canvasStore.isRecording) {
        console.log('이미 녹음 중입니다.');
        return;
    }

    try {
        const stream = await createRecordingStream();
        const { selectedType, mimeType } = selectAudioFormat();

        streamRef.current = stream;
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: selectedType });
        audioChunksRef.current = [];

        canvasStore.setRecording(true);

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = async () => {
            console.log('�� 녹음 중지됨 - STT 처리 시작');
            const audioBlob = new Blob(audioChunksRef.current, { type: selectedType });
            await processSTT(audioBlob, mimeType);

            const canvasStore = useCanvasStore.getState();
            canvasStore.setRecording(false);

            cleanupStream();
        };

        mediaRecorderRef.current.start();
        console.log('️ 녹음 시작됨');
    } catch (err) {
        console.error('마이크 접근 실패', err);
        cleanupStream();
    }
};

/** 📊 녹음 상태 확인 함수 */
export const stopRecording = () => {
    console.log('🛑 stopRecording 호출');

    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
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
