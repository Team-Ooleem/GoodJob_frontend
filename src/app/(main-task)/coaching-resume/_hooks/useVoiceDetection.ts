'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVoiceDetection {
    isSpeaking: boolean;
    volumeLevel: number;
    startDetection: () => void;
    stopDetection: () => void;
}

interface VoiceDetectionOptions {
    threshold?: number; // 음성 감지 임계값 (0-1)
    smoothingFactor?: number; // 스무딩 팩터 (0-1)
    minSpeakingDuration?: number; // 최소 말하기 지속 시간 (ms)
    debounceDelay?: number; // 디바운스 지연 시간 (ms)
}

export const useVoiceDetection = (
    stream: MediaStream | null,
    options: VoiceDetectionOptions = {},
): UseVoiceDetection => {
    const {
        threshold = 0.01, // 기본 임계값
        smoothingFactor = 0.8, // 기본 스무딩 팩터
        minSpeakingDuration = 100, // 최소 100ms
        debounceDelay = 50, // 50ms 디바운스
    } = options;

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volumeLevel, setVolumeLevel] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const smoothedVolumeRef = useRef(0);
    const speakingStartTimeRef = useRef<number | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSpeakingRef = useRef(false); // 실시간 상태 추적용

    // 오디오 컨텍스트 초기화
    const initializeAudioContext = useCallback(() => {
        if (audioContextRef.current) return;

        try {
            audioContextRef.current = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();

            // 분석 설정
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = smoothingFactor;

            // 데이터 배열 초기화
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);
        } catch (error) {
            console.error('AudioContext 초기화 실패:', error);
        }
    }, [smoothingFactor]);

    // 음성 레벨 분석 함수
    const analyzeVolume = useCallback(() => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        // 주파수 데이터 가져오기
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // 평균 볼륨 계산
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;
        const normalizedVolume = average / 255; // 0-1 범위로 정규화

        // 스무딩 적용
        smoothedVolumeRef.current =
            smoothedVolumeRef.current * smoothingFactor + normalizedVolume * (1 - smoothingFactor);

        setVolumeLevel(smoothedVolumeRef.current);

        // 음성 감지 로직
        const currentlySpeaking = smoothedVolumeRef.current > threshold;
        const now = Date.now();

        // 디버깅 로그 (개발 중에만 사용)
        // if (process.env.NODE_ENV === 'development' && smoothedVolumeRef.current > 0.001) {
        //     console.log(
        //         `Volume: ${smoothedVolumeRef.current.toFixed(4)}, Threshold: ${threshold}, Currently Speaking: ${currentlySpeaking}, Is Speaking Ref: ${isSpeakingRef.current}, Is Speaking State: ${isSpeaking}`,
        //     );
        // }

        if (currentlySpeaking) {
            // 말하기 중 - 기존 디바운스 타이머 취소
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }

            if (!isSpeakingRef.current) {
                // 말하기 시작 - 즉시 상태 업데이트
                // if (process.env.NODE_ENV === 'development') {
                //     console.log('🎤 말하기 시작');
                // }
                isSpeakingRef.current = true;
                setIsSpeaking(true);
                speakingStartTimeRef.current = now;
            }
        } else {
            if (isSpeakingRef.current) {
                // 말하기 중단 - 디바운스 적용 (기존 타이머가 있으면 유지)
                if (!debounceTimeoutRef.current) {
                    // if (process.env.NODE_ENV === 'development') {
                    //     console.log('⏰ 말하기 중단 타이머 시작 (50ms 후)');
                    // }
                    debounceTimeoutRef.current = setTimeout(() => {
                        // if (process.env.NODE_ENV === 'development') {
                        //     console.log('🔇 말하기 중단');
                        // }
                        isSpeakingRef.current = false;
                        setIsSpeaking(false);
                        speakingStartTimeRef.current = null;
                        debounceTimeoutRef.current = null;
                    }, debounceDelay);
                }
            }
        }

        // 다음 프레임 예약
        animationFrameRef.current = requestAnimationFrame(analyzeVolume);
    }, [threshold, smoothingFactor, minSpeakingDuration, debounceDelay]);

    // 음성 감지 시작
    const startDetection = useCallback(() => {
        if (!stream || audioContextRef.current?.state === 'closed') return;

        try {
            initializeAudioContext();

            if (audioContextRef.current && analyserRef.current) {
                // 오디오 스트림 연결
                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);

                // 오디오 컨텍스트 재개 (일시정지 상태일 수 있음)
                if (audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                }

                // 분석 시작
                analyzeVolume();
            }
        } catch (error) {
            console.error('음성 감지 시작 실패:', error);
        }
    }, [stream, initializeAudioContext, analyzeVolume]);

    // 음성 감지 중지
    const stopDetection = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        dataArrayRef.current = null;
        smoothedVolumeRef.current = 0;
        speakingStartTimeRef.current = null;
        isSpeakingRef.current = false;

        setIsSpeaking(false);
        setVolumeLevel(0);
    }, []);
    // 조건부 동기화로 성능 대폭 개선
    useEffect(() => {
        let syncInterval: NodeJS.Timeout | null = null;

        if (process.env.NODE_ENV === 'development') {
            syncInterval = setInterval(() => {
                if (isSpeakingRef.current !== isSpeaking) {
                    console.log(`🔄 상태 동기화: ${isSpeaking} → ${isSpeakingRef.current}`);
                    setIsSpeaking(isSpeakingRef.current);
                }
            }, 100); // 60fps → 10fps로 감소
        }

        return () => {
            if (syncInterval) clearInterval(syncInterval);
        };
    }, [isSpeaking]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            stopDetection();
        };
    }, [stopDetection]);

    // 스트림이 변경되면 자동으로 감지 시작
    useEffect(() => {
        if (stream) {
            startDetection();
        } else {
            stopDetection();
        }
    }, [stream, startDetection, stopDetection]);

    return {
        isSpeaking,
        volumeLevel,
        startDetection,
        stopDetection,
    };
};
