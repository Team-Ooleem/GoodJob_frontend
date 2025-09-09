'use client';

import { List } from 'antd';

interface SpeakerSegment {
    speakerTag: number;
    textContent: string;
    startTime: number;
    endTime: number;
    audioUrl: string;
}

interface ChatSession {
    sessionId: number;
    segments: SpeakerSegment[];
    timestamp: string;
    mentor_idx: number;
    mentee_idx: number;
    segmentIndex: number;
}

type TranscriptItem = {
    id: string;
    speaker: '멘토' | '멘티';
    timeSec: number;
    text: string;
    segment: SpeakerSegment;
    session: ChatSession;
};

function TranscriptList({
    transcripts,
    playingSegment,
    onPlaySegment,
    isFullSessionMode = false,
    audioRef,
}: {
    transcripts: TranscriptItem[];
    playingSegment: SpeakerSegment | null;
    onPlaySegment: (segment: SpeakerSegment, session: ChatSession) => void;
    isFullSessionMode?: boolean;
    audioRef?: React.RefObject<HTMLAudioElement>;
}) {
    const handleSegmentClick = (line: TranscriptItem) => {
        if (isFullSessionMode && audioRef?.current) {
            // 전체 세션 모드에서는 해당 세그먼트 시간으로 이동
            audioRef.current.currentTime = line.segment.startTime;
        } else {
            // 기존 세그먼트 모드
            onPlaySegment(line.segment, line.session);
        }
    };

    return (
        <div className='p-2 max-h-[400px] overflow-auto'>
            <List
                size='small'
                itemLayout='vertical'
                dataSource={transcripts}
                renderItem={(line) => {
                    const isCurrentlyPlaying =
                        playingSegment?.textContent === line.segment.textContent;

                    return (
                        <List.Item
                            className={`px-2 py-1 cursor-pointer hover:bg-slate-50 rounded transition-all duration-200 ${
                                isCurrentlyPlaying ? 'bg-blue-50 border border-blue-200' : ''
                            }`}
                            onClick={() => handleSegmentClick(line)}
                        >
                            <div className='flex items-start gap-2 w-full'>
                                <div
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                        line.speaker === '멘토'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                    }`}
                                >
                                    {line.speaker}
                                </div>
                                <div className='text-[11px] text-slate-500 mt-0.5'>
                                    {`${Math.floor(line.timeSec / 60)}:${String(
                                        line.timeSec % 60,
                                    ).padStart(2, '0')}`}
                                </div>
                                {isCurrentlyPlaying && (
                                    <div className='text-[11px] text-blue-600 font-medium'>
                                        재생 중
                                    </div>
                                )}
                            </div>
                            <div className='mt-1 text-[13px] leading-relaxed text-slate-800'>
                                {line.text}
                            </div>
                        </List.Item>
                    );
                }}
            />
        </div>
    );
}

export default TranscriptList;
