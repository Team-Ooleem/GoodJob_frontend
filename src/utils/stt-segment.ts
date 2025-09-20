import { ChatSession, SpeakerSegment } from '@/apis/recoding-api';

/**
 * 세그먼트 시간을 MM:SS 형식으로 포맷팅
 */
export const formatSegmentTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * 세션 시작 시간을 기준으로 한 세그먼트의 절대 시간 계산 및 포맷팅
 */
export const formatAbsoluteTime = (sessionStartTime: string, segmentStartTime: number): string => {
    const sessionStart = new Date(sessionStartTime);
    const absoluteTime = new Date(sessionStart.getTime() + segmentStartTime * 1000);

    // 오전/오후 HH:MM분 형식으로 포맷팅
    return (
        absoluteTime.toLocaleString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }) + '분'
    );
};

/**
 * 세그먼트 지속 시간 계산 (초 단위)
 */
export const calculateSegmentDuration = (startTime: number, endTime: number): number => {
    return Math.round(endTime - startTime);
};

/**
 * STT 세그먼트를 요청된 형식으로 변환
 * [멘토] 김멘토 오후 09:30분
 * 할말
 * 7초
 */
export interface FormattedSegment {
    speaker: string;
    name: string;
    absoluteTime: string; // "오후 09:30분" 형식
    text: string;
    duration: number; // 지속 시간 (초)
    durationText: string; // "7초" 형식
}

export const formatSTTSegment = (
    segment: SpeakerSegment,
    session: ChatSession,
): FormattedSegment => {
    const isMentor = segment.speakerTag === 1;
    const speaker = isMentor ? '멘토' : '멘티';
    const name = isMentor ? session.mentor_name || '이름없음' : session.mentee_name || '이름없음';

    const absoluteTime = formatAbsoluteTime(session.timestamp, segment.startTime);
    const duration = calculateSegmentDuration(segment.startTime, segment.endTime);
    const durationText = formatSegmentTime(segment.startTime);

    return {
        speaker,
        name,
        absoluteTime,
        text: segment.textContent,
        duration,
        durationText,
    };
};

/**
 * 세션의 모든 STT 세그먼트를 요청된 형식으로 변환
 */
export const formatAllSTTSegments = (session: ChatSession): FormattedSegment[] => {
    return session.segments.map((segment) => formatSTTSegment(segment, session));
};

/**
 * 멘토만 필터링하여 STT 세그먼트 추출
 */
export const getMentorSegments = (session: ChatSession): FormattedSegment[] => {
    return session.segments
        .filter((segment) => segment.speakerTag === 1)
        .map((segment) => formatSTTSegment(segment, session));
};

/**
 * 특정 시간 범위의 세그먼트만 추출
 */
export const getSegmentsInTimeRange = (
    session: ChatSession,
    startTime: number,
    endTime: number,
): FormattedSegment[] => {
    return session.segments
        .filter((segment) => segment.startTime >= startTime && segment.endTime <= endTime)
        .map((segment) => formatSTTSegment(segment, session));
};
