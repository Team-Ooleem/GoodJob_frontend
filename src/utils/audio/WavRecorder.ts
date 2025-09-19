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
}
