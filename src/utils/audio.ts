// utils/audio.ts
export async function blobToArrayBuffer(blob: Blob) {
    return await blob.arrayBuffer();
}

export async function resampleTo16kHzMonoWav(inputWavBlob: Blob): Promise<Blob> {
    const arrayBuf = await blobToArrayBuffer(inputWavBlob);
    // 원본 WAV에서 PCM 데이터와 sampleRate 읽기
    const view = new DataView(arrayBuf);
    const srcSampleRate = view.getUint32(24, true); // WAV 헤더의 sampleRate
    // decodeAudioData로 PCM 추출
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuf = await audioCtx.decodeAudioData(arrayBuf.slice(0)); // 전체 WAV 디코드
    await audioCtx.close();

    // OfflineAudioContext로 16kHz로 리샘플 (mono)
    const targetRate = 16000;
    const offline = new OfflineAudioContext(
        1,
        Math.ceil(audioBuf.duration * targetRate),
        targetRate,
    );
    const src = offline.createBufferSource();
    // mono로 다운믹스
    const mono = offline.createBuffer(1, audioBuf.length, audioBuf.sampleRate);
    const tmp = audioBuf.numberOfChannels > 1 ? mixToMono(audioBuf) : audioBuf.getChannelData(0);
    mono.copyToChannel(tmp, 0);
    src.buffer = mono;
    src.connect(offline.destination);
    src.start(0);
    const rendered = await offline.startRendering();

    // 16kHz PCM → WAV 인코딩
    const pcm = rendered.getChannelData(0);
    const wavBlob = encodeWavFromFloat32(pcm, targetRate);
    return wavBlob;

    function mixToMono(buf: AudioBuffer) {
        const len = buf.length;
        const out = new Float32Array(len);
        for (let ch = 0; ch < buf.numberOfChannels; ch++) {
            const data = buf.getChannelData(ch);
            for (let i = 0; i < len; i++) out[i] += data[i] / buf.numberOfChannels;
        }
        return out;
    }

    function encodeWavFromFloat32(samples: Float32Array, sampleRate: number) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeString = (off: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
        };
        let offset = 0;
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true); // mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        offset = 44;
        for (let i = 0; i < samples.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, samples[i]));
            s = s < 0 ? s * 0x8000 : s * 0x7fff;
            view.setInt16(offset, s, true);
        }
        return new Blob([view], { type: 'audio/wav' });
    }
}

export async function blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any);
    }
    return btoa(binary);
}
