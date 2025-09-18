'use client';

import { List } from 'antd';
import { ChatSession, SpeakerSegment, TranscriptItem } from '@/apis/recoding-api';
import { formatSTTSegment, FormattedSegment } from '@/utils';

function TranscriptList({
    transcripts,
    playingSegment,
    onPlaySegment,
    currentTime, // currentTime 추가
}: {
    transcripts: TranscriptItem[];
    playingSegment: SpeakerSegment | null;
    onPlaySegment: (segment: SpeakerSegment, session: ChatSession) => void;
    currentTime?: number; // currentTime prop 추가
}) {
    const handleSegmentClick = (line: TranscriptItem) => {
        // 특정 세그먼트 클릭 시 해당 부분으로 이동
        onPlaySegment(line.segment, line.session);
    };

    // STT 세그먼트를 새로운 형식으로 변환
    const formattedSegments: FormattedSegment[] = transcripts.map((line) =>
        formatSTTSegment(line.segment, line.session),
    );

    return (
        <div className='flex flex-col h-full min-h-0'>
            {/* STT 타임라인 리스트 - 새로운 형식 적용 */}
            <div className='flex-1 p-2 overflow-auto min-h-0'>
                <List
                    size='small'
                    itemLayout='vertical'
                    dataSource={formattedSegments}
                    renderItem={(formattedSegment, index) => {
                        const originalTranscript = transcripts[index];

                        // currentTime을 기준으로 현재 재생 중인 세그먼트 찾기
                        const isCurrentlyPlaying =
                            currentTime !== undefined &&
                            currentTime >= originalTranscript.segment.startTime &&
                            currentTime <= originalTranscript.segment.endTime;

                        return (
                            <List.Item
                                className={`px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md transition-colors duration-200 ${
                                    isCurrentlyPlaying
                                        ? 'border border-blue-400' // 기존 배경색 유지, 파란색 테두리만
                                        : 'border border-transparent'
                                }`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSegmentClick(originalTranscript);
                                }}
                                style={{
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    pointerEvents: 'auto',
                                }}
                            >
                                <div
                                    className='w-full'
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSegmentClick(originalTranscript);
                                    }}
                                >
                                    {/* 🎯 새로운 형식: 멘토 김멘토 오후 09:30분 */}
                                    <div className='flex items-start gap-2 w-full mb-2'>
                                        {/* [멘토]만 박스 안에 */}
                                        <div
                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                                formattedSegment.speaker === '멘토'
                                                    ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'
                                                    : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                            }`}
                                        >
                                            {formattedSegment.speaker}
                                        </div>

                                        {/* 이름과 시간은 박스 밖으로 */}
                                        <div className='text-xs text-foreground font-medium'>
                                            <span className='font-bold'>
                                                {formattedSegment.name}
                                            </span>{' '}
                                            <span className='text-muted-foreground'>
                                                {formattedSegment.durationText}
                                            </span>
                                        </div>

                                        {/* 🎯 재생 중 표시 */}
                                        {isCurrentlyPlaying && (
                                            <div className='text-xs text-primary font-medium flex items-center gap-1'>
                                                <div className='w-2 h-2 bg-primary rounded-full animate-pulse'></div>
                                                재생 중
                                            </div>
                                        )}
                                    </div>

                                    {/* 🎯 텍스트 내용 */}
                                    <div className='text-sm leading-relaxed text-foreground mb-1'>
                                        {formattedSegment.text}
                                    </div>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            </div>
        </div>
    );
}

export default TranscriptList;
