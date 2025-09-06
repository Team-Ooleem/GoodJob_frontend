'use client';
import { useRef, useCallback } from 'react';
import axios from 'axios';

type RecorderOptions = {
    /** 녹음 상태 변경 시 콜백 (true: 녹음 시작, false: 녹음 종료) */
    onRecordingChange?: (isRecording: boolean) => void;
    canvasIdx: number;
    mentorId?: number;
    menteeId?: number;
    messageId?: number;
};

export function useVoiceRecorder({ onRecordingChange, canvasIdx }: RecorderOptions) {
    /** 녹음 상태를 Ref로 관리 (useState 없이) */
    const isRecordingRef = useRef(false);
    /** MediaRecorder 인스턴스 */
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    /** 녹음 중 생성된 오디오 청크를 저장 */
    const audioChunksRef = useRef<Blob[]>([]);
    /** getUserMedia 스트림 저장 */
    const streamRef = useRef<MediaStream | null>(null);

    /** 녹음 시작 함수 */
    const startRecording = useCallback(async () => {
        if (isRecordingRef.current) return; // 이미 녹음 중이면 무시

        try {
            // 마이크 접근
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 사용할 오디오 형식
            const selectedType = 'audio/webm;codecs=opus';
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: selectedType });

            // 초기화
            audioChunksRef.current = [];
            isRecordingRef.current = true;
            onRecordingChange?.(true);

            // 데이터 수집
            mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
                console.log('오디오 청크 수집:', e.data.size);
            };

            // 녹음 종료 시 처리
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: selectedType });

                try {
                    // // 1. DB에서 현재 세션의 사용자 정보 조회
                    // const userResponse = await axios.get(
                    //     `http://localhost:4000/api/stt/session-users/${canvasIdx}`,
                    // );
                    // const { mentor, mentee } = userResponse.data;
                    // const mentorIdx = mentor.idx;
                    // const menteeIdx = mentee.idx;
                    const mentorIdx = 1;
                    const menteeIdx = 2;

                    console.log('사용자 정보 조회:', { mentorIdx, menteeIdx });

                    // 2. Blob을 Base64로 변환
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const base64Data = Buffer.from(arrayBuffer).toString('base64');

                    // 3. STT + DB + S3 서버 전송
                    const sttResponse = await axios.post(
                        'http://localhost:4000/api/stt/transcribe-with-context',
                        {
                            audioData: base64Data,
                            mimeType: 'audio/webm',
                            canvasIdx: canvasIdx,
                            mentorIdx: mentorIdx,
                            menteeIdx: menteeIdx,
                        },
                    );

                    console.log('STT 결과:', sttResponse.data);
                    console.log('DB 저장 완료 - 세션 ID:', sttResponse.data.sttSessionIdx);
                } catch (err) {
                    console.error('STT 또는 DB 처리 실패', err);
                }

                // 스트림 정리
                streamRef.current?.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                isRecordingRef.current = false;
                onRecordingChange?.(false);
            };

            // 녹음 시작
            mediaRecorderRef.current.start();
        } catch (err) {
            console.error('마이크 접근 실패', err);
            isRecordingRef.current = false;
            onRecordingChange?.(false);
        }
    }, [onRecordingChange, canvasIdx]);

    /** 녹음 정지 함수 */
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        // 스트림 정리
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        isRecordingRef.current = false;
        onRecordingChange?.(false);
    }, [onRecordingChange]);

    /** 버튼용 토글 함수 */
    const handleRecord = useCallback(() => {
        if (isRecordingRef.current) stopRecording();
        else startRecording();
    }, [startRecording, stopRecording]);

    // 훅 반환
    return { isRecordingRef, startRecording, stopRecording, handleRecord };
}
