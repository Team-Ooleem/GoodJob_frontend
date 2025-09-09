'use client';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useUserStore } from '@/stores/user-store';

// 전역 ref들
const isRecordingRef = { current: false };
const mediaRecorderRef = { current: null as MediaRecorder | null };
const audioChunksRef = { current: [] as Blob[] };
const streamRef = { current: null as MediaStream | null };
const canvasIdxRef = { current: 'default-canvas-uuid' };

/** 스트림 정리 함수 */
const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    isRecordingRef.current = false;
};

/** canvas IDX 설정 함수 */
export const setCanvasIdx = (id: string) => {
    canvasIdxRef.current = id;
};

/** canvas 참여자 정보 가져오기 */
const getCanvasParticipants = async (canvasId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/canvas/${canvasId}/participants`);
        return response.data;
    } catch (error) {
        console.error('Canvas 참여자 정보 조회 실패:', error);
        return null;
    }
};

/** 녹음 시작 함수 */
export const startRecording = async () => {
    if (isRecordingRef.current) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const selectedType = 'audio/webm;codecs=opus';
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: selectedType });

        audioChunksRef.current = [];
        isRecordingRef.current = true;

        mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: selectedType });

            try {
                // Canvas 참여자 정보 가져오기
                const participants = await getCanvasParticipants(canvasIdxRef.current);

                let mentorIdx: number;
                let menteeIdx: number;

                // DB 조회 실패 시 fallback
                if (!participants || participants.length < 2) {
                    console.warn('Canvas 참여자 조회 실패, 기본값 사용');
                    mentorIdx = 1; // 김개발
                    menteeIdx = 2; // 이디자인
                } else {
                    // 현재 로그인한 사용자 정보 가져오기
                    const currentUser = useUserStore.getState().user;

                    if (currentUser && currentUser.idx) {
                        // 현재 사용자를 멘티로, 다른 사용자를 멘토로 설정
                        menteeIdx = currentUser.idx;
                        const mentor = participants.find((p: any) => p.user_id !== currentUser.idx);
                        mentorIdx = mentor ? mentor.user_id : participants[0].user_id;
                    } else {
                        // 사용자 정보가 없으면 첫 번째/두 번째 참여자 사용
                        mentorIdx = participants[0].user_id;
                        menteeIdx = participants[1].user_id;
                    }
                }

                // 메모리 효율적인 Base64 변환 (FileReader 사용)
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(audioBlob);
                });

                const blobSizeKB = audioBlob.size / 1024;
                let duration = Math.max(3, Math.min(30, blobSizeKB * 0.1));

                const requestData = {
                    audioData: base64Data,
                    mimeType: 'audio/webm',
                    canvasId: canvasIdxRef.current,
                    mentorIdx: mentorIdx,
                    menteeIdx: menteeIdx,
                    isFinalChunk: true,
                    chunkIndex: 0,
                    totalChunks: 1,
                    duration: duration,
                };

                await axios.post(`${API_BASE_URL}/stt/transcribe-with-context`, requestData);
            } catch (err) {
                console.error('STT 또는 DB 처리 실패', err);
            }

            cleanupStream();
        };

        mediaRecorderRef.current.start();
    } catch (err) {
        console.error('마이크 접근 실패', err);
        cleanupStream();
    }
};

/** 녹음 정지 함수 */
export const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
    } else {
        cleanupStream();
    }
};
