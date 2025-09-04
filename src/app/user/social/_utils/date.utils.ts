/**
 * 날짜 관련 유틸리티 함수들
 */

/**
 * 시간을 "방금 전", "5분 전" 등의 형태로 포맷팅
 */
export const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
};
