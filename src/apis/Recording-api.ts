export interface SpeakerSegment {
    speakerTag: number;
    textContent: string;
    startTime: number;
    endTime: number;
    audioUrl: string;
}

export interface ChatSession {
    sessionIdx: number;
    segments: SpeakerSegment[];
    timestamp: string;
    mentor_idx: number;
    mentee_idx: number;
    segmentIndex: number;
    audioDuration: number;
    audioUrl: string;
}

export interface SessionUser {
    idx: number;
    name: string;
    email: string;
}

export interface SessionUserResponse {
    mentor: SessionUser;
    mentee: SessionUser;
}

export interface STTWithContextResponse {
    messages: any[]; // (백엔드 응답에 맞춤)
    success: boolean;
    message?: string;
    totalCount?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
}

export const transformBackendToFrontend = (
    session: any,
    mentorIdx: number,
    menteeIdx: number,
): ChatSession => {
    return {
        sessionIdx: parseInt(session.messageId),
        segments: session.segments
            .map((seg: any) => ({
                speakerTag: seg.speakerTag,
                textContent: seg.textContent,
                startTime: parseFloat(seg.startTime) || 0,
                endTime: parseFloat(seg.endTime) || 0,
                audioUrl: session.audioUrl,
            }))
            .filter((seg: any) => seg.startTime >= 0 && seg.endTime > seg.startTime),
        timestamp: session.timestamp,
        mentor_idx: mentorIdx,
        mentee_idx: menteeIdx,
        segmentIndex: session.segmentIndex,
        audioDuration: session.audioDuration || 0,
        audioUrl: session.audioUrl,
    };
};

export type TranscriptItem = {
    id: string;
    speaker: string;
    timeSec: number;
    text: string;
    segment: SpeakerSegment;
    session: ChatSession;
};

export type RecordingItem = {
    id: string;
    title: string;
    durationSec: number;
    createdAt: string;
};
