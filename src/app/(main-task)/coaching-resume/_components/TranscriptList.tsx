'use client';

import { List } from 'antd';
import AudioPlayer from './AudioPlayer';

import { ChatSession, SpeakerSegment, TranscriptItem } from '@/apis/Recording-api';

function TranscriptList({
    transcripts,
    playingSegment,
    onPlaySegment,
    isFullSessionMode = false,
    audioRef,
    // AudioPlayer에 필요한 props 추가
    currentSegment,
    currentSession,
    currentTime,
    duration,
    isPlaying,
    onPlayPause,
    onClose,
}: {
    transcripts: TranscriptItem[];
    playingSegment: SpeakerSegment | null;
    onPlaySegment: (segment: SpeakerSegment, session: ChatSession) => void;
    isFullSessionMode?: boolean;
    audioRef?: React.RefObject<HTMLAudioElement>;
    // AudioPlayer props 추가
    currentSegment: SpeakerSegment | null;
    currentSession: ChatSession | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    onPlayPause: () => void;
    onClose: () => void;
}) {
    const handleSegmentClick = (line: TranscriptItem) => {
        // 특정 세그먼트 클릭 시 해당 부분으로 이동
        onPlaySegment(line.segment, line.session);
    };

    return (
        <div className='flex flex-col h-full min-h-0'>
            {/* STT 타임라인 리스트 - p-2 패딩 적용 */}
            <div className='flex-1 p-2 overflow-auto min-h-0'>
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

            {/* AudioPlayer - 바닥에 고정 */}
            <div className='flex-shrink-0'>
                <AudioPlayer
                    playingSegment={playingSegment}
                    currentSegment={currentSegment}
                    currentSession={currentSession}
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    onPlayPause={onPlayPause}
                    onClose={onClose}
                />
            </div>
        </div>
    );
}

export default TranscriptList;
