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
        console.error('캔버스 참가자 정보 가져오기 실패:', error);

        return null;
    }
};

/** 녹음 시작 함수 */
export const startRecording = async () => {
    if (isRecordingRef.current) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        let selectedType = 'audio/mp4';
        let mimeType = 'audio/mp4';

        // MP4 지원 확인 (1순위)
        if (!MediaRecorder.isTypeSupported('audio/mp4')) {
            // MP4 미지원 시 WebM Opus로 fallback
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                selectedType = 'audio/webm;codecs=opus';
                mimeType = 'audio/webm';
            } else {
                // 최후 fallback으로 일반 WebM 사용
                selectedType = 'audio/webm';
                mimeType = 'audio/webm';
            }
        }
        console.log(`선택된 오디오 포맷: ${selectedType}`);
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: selectedType });

        audioChunksRef.current = [];
        isRecordingRef.current = true;

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
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

                // �� MP4/MP3 기반 duration 추정 개선
                const blobSizeKB = audioBlob.size / 1024;
                let duration: number;

                if (mimeType === 'audio/mp4') {
                    // MP4: 일반적으로 128kbps 기준 (더 정확한 추정)
                    duration = Math.max(3, Math.min(30, blobSizeKB * 0.08));
                } else if (mimeType === 'audio/mp3') {
                    // MP3: 일반적으로 128kbps 기준
                    duration = Math.max(3, Math.min(30, blobSizeKB * 0.08));
                } else {
                    // WebM fallback: 기존 방식
                    duration = Math.max(3, Math.min(30, blobSizeKB * 0.1));
                }

                // 🆕 더 정확한 duration 계산을 위해 Audio API 사용
                try {
                    const audio = new Audio();
                    const url = URL.createObjectURL(audioBlob);

                    await new Promise((resolve, reject) => {
                        audio.addEventListener('loadedmetadata', () => {
                            URL.revokeObjectURL(url);
                            if (audio.duration && isFinite(audio.duration)) {
                                duration = audio.duration;
                                console.log(`정확한 duration: ${duration}초`);
                            }
                            resolve(duration);
                        });

                        audio.addEventListener('error', () => {
                            URL.revokeObjectURL(url);
                            console.warn('Audio duration 계산 실패, 추정값 사용');
                            resolve(duration);
                        });

                        audio.src = url;
                    });
                } catch (error) {
                    console.warn('Audio duration 계산 실패, 추정값 사용:', error);
                }

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

/** 스트림 정리 함수 */
const cleanupStream = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    isRecordingRef.current = false;
};

/** 녹음 정지 함수 */
export const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
    } else {
        cleanupStream();
    }
};
