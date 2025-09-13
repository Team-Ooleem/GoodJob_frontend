// =============날짜 관련 유틸리티=============
/**
 * UTC 시간을 KST(한국 표준시)로 변환
 */
const convertUTCToKST = (utcDate: Date): Date => {
    // UTC 시간에 9시간(32400000ms)을 더해서 KST로 변환
    return new Date(utcDate.getTime() + 9 * 60 * 60 * 1000);
};

/**
 * 시간을 "방금 전", "5분 전" 등의 형태로 포맷팅 (UTC → KST 변환)
 */
export const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const utcPostDate = new Date(dateString);
    const kstPostDate = convertUTCToKST(utcPostDate);

    const diffInMinutes = Math.floor((now.getTime() - kstPostDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
};

/**
 * 날짜를 한국어 형식으로 포맷팅 (UTC → KST 변환)
 */
export const formatKoreanDate = (dateString: string): string => {
    const utcDate = new Date(dateString);
    const kstDate = convertUTCToKST(utcDate);

    return kstDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅 (UTC → KST 변환)
 */
export const formatKoreanDateTime = (dateString: string): string => {
    const utcDate = new Date(dateString);
    const kstDate = convertUTCToKST(utcDate);

    return kstDate.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};
