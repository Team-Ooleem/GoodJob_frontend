'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Spin, Empty } from 'antd';

import { API_BASE_URL } from '@/constants/config';
import { useAudioPlayer } from '../_hooks/useAudioPlayer';
import { ChatSession, SpeakerSegment } from '@/apis/recoding-api';
// 🚨 AudioPlayer import 제거
// import AudioPlayer from './AudioPlayer';

interface ReplayChatProps {
    canvasIdx: number;
    isOpen: boolean;
    currentUserId?: number;
}

export function ReplayChat({ canvasIdx, isOpen, currentUserId }: ReplayChatProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // useAudioPlayer 훅 사용
    const {
        currentSession,
        currentSegment,
        playingSegment,
        isPlaying,
        prepareAudio,
        handleSegmentClick: audioHandleSegmentClick,
        stopAudio,
    } = useAudioPlayer();

    // ... 기존 코드 유지 ...

    if (!isOpen) return null;

    return (
        <>
            {/* 🚨 AudioPlayer 컴포넌트 제거 */}
            {/* <div className='fixed bottom-4 left-4 right-4 z-[60]'>
                <AudioPlayer />
            </div> */}

            {/* ReplayChat 팝업 */}
            <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                {/* ... 기존 코드 유지 ... */}
            </div>
        </>
    );
}
