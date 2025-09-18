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
    mentor_name?: string;
    mentee_idx: number;
    mentee_name?: string;
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
    messages: BackendSessionMessage[]; // (백엔드 응답에 맞춤)
    success: boolean;
    message?: string;
    totalCount?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
}

export const transformBackendToFrontend = (
    session: BackendSessionMessage, // 🆕 any → BackendSessionMessage
    mentorIdx: number,
    mentorName: string,
    menteeIdx: number,
    menteeName: string,
): ChatSession => {
    return {
        sessionIdx: session.messageId,
        segments: session.segments
            .map((seg) => ({
                speakerTag: seg.speakerTag,
                textContent: seg.textContent,
                startTime: parseFloat(seg.startTime.toString()) || 0,
                endTime: parseFloat(seg.endTime.toString()) || 0,
                audioUrl: session.audioUrl,
            }))
            .filter((seg) => seg.startTime >= 0 && seg.endTime > seg.startTime),
        timestamp: session.timestamp,
        mentor_idx: mentorIdx,
        mentor_name: mentorName,
        mentee_idx: menteeIdx,
        mentee_name: menteeName,
        segmentIndex: 0, // 기본값
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

export interface BackendSessionMessage {
    messageId: number;
    audioUrl: string;
    timestamp: string;
    mentor_idx: number;
    mentor_name?: string;
    mentee_idx: number;
    mentee_name?: string;
    segments: Array<{
        speakerTag: number;
        textContent: string;
        startTime: number;
        endTime: number;
    }>;
    audioDuration: number;
}

// 전역 상태 관리
export interface VoiceRecorderState {
    mediaRecorder: MediaRecorder | null;
    audioChunks: Blob[];
    stream: MediaStream | null;
    canvasIdx: string;
    wavRecorder?: any; // 🆕 추가
    webrtcStreams: {
        localStream: MediaStream | null;
        remoteStream: MediaStream | null;
    };
    logFlags: {
        streamCreated: boolean;
        formatSelected: boolean;
        sttProcessed: boolean;
        recordingStarted: boolean;
        recordingStopped: boolean;
        alreadyRecording: boolean;
        participantsError: boolean;
        fallbackWarning: boolean;
        directMic: boolean;
        durationCalculated: boolean;
        durationFailed: boolean;
        sttCompleted: boolean;
        sttFailed: boolean;
        micAccessFailed: boolean;
        [key: string]: boolean;
    };
}
