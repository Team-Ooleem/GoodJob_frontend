'use client';
import axios from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useUserStore } from '@/stores/user-store';
import { useCanvasStore } from '../_stores';
import { VoiceRecorderState } from '@/apis/recoding-api';

const CHUNK_DURATION = 60000;
let chunkIndex = 0;
let totalChunks = 0;

// 🆕 WavRecorder 클래스 추가
class WavRecorder {
    private audioCtx: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private buffers: Float32Array[] = [];
    private recording = false;
    private stopped = false;
    private chunkCallback: ((blob: Blob) => void) | null = null;
    private chunkTimer: NodeJS.Timeout | null = null;

    setChunkCallback(callback: (blob: Blob) => void) {
        this.chunkCallback = callback;
    }

    async start() {
        if (this.recording) return;

        // WebRTC 스트림 또는 마이크 스트림 사용
        const { localStream, remoteStream } = globalState.webrtcStreams;

        if (localStream || remoteStream) {
            // WebRTC 스트림 결합
            this.stream = new MediaStream();
            if (localStream) {
                localStream.getAudioTracks().forEach((track) => this.stream!.addTrack(track));
            }
            if (remoteStream) {
                remoteStream.getAudioTracks().forEach((track) => this.stream!.addTrack(track));
            }

            if (this.stream.getAudioTracks().length === 0) {
                // fallback to mic
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
        } else {
            // 직접 마이크 사용
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000, // Google Speech API 권장값
        });

        this.source = this.audioCtx.createMediaStreamSource(this.stream);
        this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
        this.source.connect(this.processor);
        this.processor.connect(this.audioCtx.destination);
        this.buffers = [];
        this.recording = true;
        this.stopped = false;

        this.processor.onaudioprocess = (e) => {
            if (!this.recording) return;
            const ch0 = e.inputBuffer.getChannelData(0);
            this.buffers.push(new Float32Array(ch0));
        };

        // 청크 타이머 시작 (60초마다)
        this.startChunkTimer();
    }

    private startChunkTimer() {
        this.chunkTimer = setInterval(() => {
            if (this.recording && this.chunkCallback && this.buffers.length > 0) {
                const chunkWav = this.createChunk();
                this.chunkCallback(chunkWav);
                // 청크 생성 후 버퍼 일부 클리어 (메모리 관리)
                this.buffers = this.buffers.slice(-1000); // 마지막 1000개만 유지
            }
        }, CHUNK_DURATION);
    }

    private createChunk(): Blob {
        const sr = this.audioCtx?.sampleRate || 16000;
        const samples = this.merge([...this.buffers]); // 복사본 사용
        return this.encodeWAV(samples, sr);
    }

    async stop(): Promise<Blob> {
        if (this.stopped) {
            return this.encodeWAV(new Float32Array(0), this.audioCtx?.sampleRate || 16000);
        }

        this.stopped = true;
        this.recording = false;

        // 청크 타이머 정리
        if (this.chunkTimer) {
            clearInterval(this.chunkTimer);
            this.chunkTimer = null;
        }

        // 정리 작업
        try {
            if (this.processor) this.processor.onaudioprocess = null;
            if (this.processor) this.processor.disconnect();
            if (this.source) this.source.disconnect();

            // WebRTC 스트림이 아닌 경우에만 트랙 중지
            const { localStream, remoteStream } = globalState.webrtcStreams;
            const isWebRTCStream = this.stream === localStream || this.stream === remoteStream;

            if (!isWebRTCStream && this.stream) {
                this.stream.getTracks().forEach((track) => track.stop());
            }
        } catch {}

        const sr = this.audioCtx?.sampleRate || 16000;
        const samples = this.merge(this.buffers);
        const wav = this.encodeWAV(samples, sr);

        try {
            if (this.audioCtx && this.audioCtx.state !== 'closed') await this.audioCtx.close();
        } catch {}

        // 초기화
        this.audioCtx = null;
        this.stream = null;
        this.source = null;
        this.processor = null;
        this.buffers = [];
        this.chunkCallback = null;

        return wav;
    }

    private merge(chunks: Float32Array[]) {
        const total = chunks.reduce((a, b) => a + b.length, 0);
        const out = new Float32Array(total);
        let off = 0;
        for (const c of chunks) {
            out.set(c, off);
            off += c.length;
        }
        return out;
    }

    private encodeWAV(samples: Float32Array, sampleRate: number) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeString = (off: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
        };
        const floatTo16 = (off: number, input: Float32Array) => {
            for (let i = 0; i < input.length; i++, off += 2) {
                let s = Math.max(-1, Math.min(1, input[i]));
                s = s < 0 ? s * 0x8000 : s * 0x7fff;
                view.setInt16(off, s, true);
            }
        };
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        floatTo16(44, samples);
        return new Blob([view], { type: 'audio/wav' });
    }
}

// 전역 상태 관리 (WavRecorder 추가)
const globalState: VoiceRecorderState = {
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
    canvasIdx: '',
    wavRecorder: new WavRecorder(), // 🆕 추가
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
                        logOnce('durationTimeout', 'Duration 계산 타임아웃, 추정값 사용', 'warn');
                        resolve();
                    }, 3000);

                    audio.addEventListener('loadedmetadata', () => {
                        clearTimeout(timeoutId);
                        URL.revokeObjectURL(url);
                        if (audio.duration && isFinite(audio.duration)) {
                            duration = audio.duration;
                            logOnce('durationCalculated', `정확한 duration: ${duration}초`);
                        }
                        resolve();
                    });

                    audio.addEventListener('error', () => {
                        clearTimeout(timeoutId);
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

// 🔧 간소화된 STT 처리 함수 (WAV 변환 제거)
const processSTTChunk = async (
    audioBlob: Blob,
    mimeType: string, // 항상 'audio/wav'
    currentChunkIndex: number,
    isFinal: boolean,
) => {
    try {
        console.log(
            `🔍 청크 ${currentChunkIndex} 처리 시작 - 크기: ${audioBlob.size} bytes, 형식: ${mimeType}`,
        );

        // Canvas 참여자 정보 가져오기
        const participants = await getCanvasParticipants(globalState.canvasIdx);

        let mentorIdx: number;
        let menteeIdx: number;

        if (!participants || participants.length < 2) {
            logOnce('participantsError', 'Canvas 참여자 조회 실패, 기본값 사용', 'warn');
            mentorIdx = 5;
            menteeIdx = 10;
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

        // Base64 변환 (WAV 직접 사용)
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
            logOnce(`chunk${currentChunkIndex}Empty`, `청크 ${currentChunkIndex} Base64 비어있음`);
            return;
        }

        // Duration 계산
        const duration = await calculateDuration(audioBlob, mimeType);

        // 정확한 시간 계산
        const chunkStartTime = currentChunkIndex * duration;
        const chunkEndTime = (currentChunkIndex + 1) * duration;

        const requestData = {
            audioData: base64Data,
            mimeType: mimeType, // 항상 'audio/wav'
            canvasId: globalState.canvasIdx,
            mentorIdx: mentorIdx,
            menteeIdx: menteeIdx,
            isFinalChunk: isFinal,
            chunkIndex: currentChunkIndex,
            totalChunks: isFinal ? totalChunks : -1,
            duration: duration,
            isNewRecordingSession: currentChunkIndex === 0,
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

/**녹음 시작 함수 (WavRecorder 사용) */
export const startRecording = async () => {
    const canvasStore = useCanvasStore.getState();
    if (canvasStore.isRecording) {
        logOnce('alreadyRecording', '이미 녹음 중입니다.');
        return;
    }

    try {
        // WavRecorder 콜백 설정
        globalState.wavRecorder.setChunkCallback(async (wavBlob: Blob) => {
            console.log(`🎵 청크 ${chunkIndex} 생성됨 - 크기: ${wavBlob.size} bytes`);
            await processSTTChunk(wavBlob, 'audio/wav', chunkIndex, false);
            chunkIndex++;
        });

        await globalState.wavRecorder.start();

        // 청크 카운터 초기화
        chunkIndex = 0;
        totalChunks = 0;
        canvasStore.setRecording(true);

        logOnce('recordingStarted', '🎙️ WAV 직접 녹음 시작됨 (16000Hz)');
    } catch (err) {
        logOnce('micAccessFailed', '마이크 접근 실패', 'error');
        canvasStore.setRecording(false);
    }
};

/**녹음 중지 함수 (WavRecorder 사용) */
export const stopRecording = async () => {
    const canvasStore = useCanvasStore.getState();

    try {
        // 최종 WAV 생성
        const finalWav = await globalState.wavRecorder.stop();

        // 최종 청크 처리
        console.log(`🎵 최종 청크 ${chunkIndex} 생성됨 - 크기: ${finalWav.size} bytes`);
        await processSTTChunk(finalWav, 'audio/wav', chunkIndex, true);
        totalChunks = chunkIndex + 1;

        canvasStore.setRecording(false);

        // 청크 카운터 초기화
        chunkIndex = 0;
        totalChunks = 0;

        logOnce('recordingStopped', '️ WAV 녹음 중지됨');
    } catch (err) {
        console.error('녹음 중지 실패:', err);
        canvasStore.setRecording(false);
    }
};

export const isRecording = () => {
    const canvasStore = useCanvasStore.getState();
    return canvasStore.isRecording;
};
