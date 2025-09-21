/**
 * WAV 오디오 녹음을 위한 유틸리티 클래스
 * 브라우저의 MediaRecorder API를 사용하여 실시간 오디오 녹음 및 WAV 파일 생성
 */
export class WavRecorder {
    private audioCtx: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private buffers: Float32Array[] = [];
    private recording = false;
    private stopped = false;
    private chunkCallback: ((chunk: Blob) => void) | null = null;
    private chunkTimer: NodeJS.Timeout | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private localSource: MediaStreamAudioSourceNode | null = null;
    private remoteSource: MediaStreamAudioSourceNode | null = null;
    private merger: ChannelMergerNode | null = null;
    private fallbackStream: MediaStream | null = null;

    async start() {
        if (this.recording) return;
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    }

    async stop(): Promise<Blob> {
        if (this.stopped) {
            return this.encodeWAV(new Float32Array(0), this.audioCtx?.sampleRate || 44100);
        }
        this.stopped = true;
        this.recording = false;

        try {
            if (this.processor) this.processor.onaudioprocess = null;
        } catch {}
        try {
            if (this.processor) this.processor.disconnect();
        } catch {}
        try {
            if (this.source) this.source.disconnect();
        } catch {}
        try {
            if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
        } catch {}

        const sr = this.audioCtx?.sampleRate || 44100;
        const samples = this.merge(this.buffers);
        const wav = this.encodeWAV(samples, sr);

        try {
            if (this.audioCtx && this.audioCtx.state !== 'closed') {
                await this.audioCtx.close();
            }
        } catch {
        } finally {
            this.audioCtx = null;
            this.stream = null;
            this.source = null;
            this.processor = null;
            this.buffers = [];
        }

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

    setChunkCallback(callback: (chunk: Blob) => void) {
        this.chunkCallback = callback;
    }

    private startChunkTimer() {
        this.chunkTimer = setInterval(() => {
            if (this.recording && this.chunkCallback) {
                // 60초 정확히 지났을 때만 청크 생성
                const chunkWav = this.createChunk();
                this.chunkCallback(chunkWav);
                this.buffers = [];
            }
        }, 60000); // 정확히 60초
    }

    private createChunk() {
        const sr = this.audioCtx?.sampleRate || 44100;
        const samples = this.merge(this.buffers);
        return this.encodeWAV(samples, sr);
    }

    setWebRTCStreams(localStream: MediaStream | null, remoteStream: MediaStream | null) {
        this.localStream = localStream;
        this.remoteStream = remoteStream;
        console.log('��️ WebRTC 스트림 설정됨:', {
            local: localStream ? '있음' : '없음',
            remote: remoteStream ? '있음' : '없음',
        });
    }

    async webRTCStart() {
        if (this.recording) return;

        this.recording = true;
        this.stopped = false;
        this.buffers = [];

        try {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

            console.log('️ WebRTC 스트림으로 녹화 시작');
            console.log('️ 로컬 스트림:', this.localStream ? '있음' : '없음');
            console.log('️ 원격 스트림:', this.remoteStream ? '있음' : '없음');

            // 🆕 로컬 스트림이 없으면 로컬 마이크 사용
            if (!this.localStream) {
                console.log('️ 로컬 스트림이 없어서 로컬 마이크 사용');
                this.fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.localSource = this.audioCtx.createMediaStreamSource(this.fallbackStream);
            } else {
                // 로컬 스트림 설정
                this.localSource = this.audioCtx.createMediaStreamSource(this.localStream);
            }

            // 원격 스트림 설정
            if (this.remoteStream) {
                this.remoteSource = this.audioCtx.createMediaStreamSource(this.remoteStream);
            }

            // 양쪽 스트림을 합치는 로직
            if (this.localSource && this.remoteSource) {
                // 양쪽 스트림을 합쳐서 녹화
                this.merger = this.audioCtx.createChannelMerger(2);
                this.localSource.connect(this.merger, 0, 0); // 왼쪽 채널
                this.remoteSource.connect(this.merger, 0, 1); // 오른쪽 채널
                console.log('️ 양쪽 스트림 합쳐서 녹화');
            } else if (this.localSource) {
                // 로컬 스트림만 사용
                this.merger = this.localSource;
                console.log('️ 로컬 스트림만 녹화');
            } else if (this.remoteSource) {
                // 원격 스트림만 사용
                this.merger = this.remoteSource;
                console.log('️ 원격 스트림만 녹화');
            } else {
                throw new Error('녹화할 스트림이 없습니다.');
            }

            // 오디오 처리 설정
            this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
            this.merger.connect(this.processor);
            this.processor.connect(this.audioCtx.destination);

            this.processor.onaudioprocess = (e) => {
                if (!this.recording) return;
                const ch0 = e.inputBuffer.getChannelData(0);
                this.buffers.push(new Float32Array(ch0));
            };

            // 청크 타이머 시작
            this.startChunkTimer();
        } catch (error) {
            console.error('WebRTC 녹화 시작 실패:', error);
            this.recording = false;
            throw error;
        }
    }

    async webRTCStop() {
        if (!this.recording) return;

        console.log('🎬 WebRTC 스트림 녹화 종료');

        this.recording = false;
        this.stopped = true;

        // 타이머 정리 (더 이상 새로운 청크 생성 방지)
        if (this.chunkTimer) {
            clearInterval(this.chunkTimer);
            this.chunkTimer = null;
        }

        // 🔧 마지막 오디오 데이터 수집 대기
        await new Promise((resolve) => setTimeout(resolve, 100));

        // AudioContext 닫기 전에 마지막 청크 전송
        const currentSampleRate = this.audioCtx?.sampleRate || 44100;

        // 🔧 버퍼가 있거나 강제로 마지막 청크 생성
        if (this.chunkCallback) {
            if (this.buffers.length > 0) {
                const totalSamples = this.buffers.reduce((sum, buf) => sum + buf.length, 0);
                const durationSeconds = totalSamples / currentSampleRate;
                console.log(
                    `🔚 녹화 종료 시 마지막 청크 전송: ${this.buffers.length}개 버퍼, ${totalSamples}개 샘플, ${durationSeconds.toFixed(2)}초`,
                );

                const finalChunk = this.createChunk();
                console.log(`🔚 최종 청크 크기: ${finalChunk.size} bytes`);
                this.chunkCallback(finalChunk);
            } else {
                // 🔧 버퍼가 없어도 빈 청크라도 생성해서 전송 (완전성 보장)
                console.log('🔚 버퍼 없음 - 빈 청크 생성 후 전송');
                const emptyChunk = this.createChunk(); // 빈 청크 생성
                this.chunkCallback(emptyChunk);
            }

            this.buffers = []; // 버퍼 클리어
        } else {
            console.log('🔚 chunkCallback이 없어서 최종 청크 전송 불가');
        }

        // 이제 안전하게 오디오 리소스 정리
        if (this.processor) {
            this.processor.disconnect();
        }

        if (this.merger) {
            this.merger.disconnect();
        }

        if (this.audioCtx) {
            await this.audioCtx.close();
        }

        // 🆕 로컬 마이크 스트림이 있으면 정리
        if (this.fallbackStream) {
            this.fallbackStream.getTracks().forEach((track) => track.stop());
            this.fallbackStream = null;
            console.log('🎬 로컬 마이크 스트림 정리 완료');
        }

        // WebRTC 스트림은 정리하지 않음 (다른 곳에서 사용할 수 있음)
        console.log('🎬 WebRTC 스트림 녹화 종료 완료');
    }
}
