// =============날짜 관련 유틸리티=============
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

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export const formatKoreanDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * 연봉을 만원 단위로 포맷팅
 */
export const formatSalary = (salary: number): string => {
    return `${(salary / 10000).toLocaleString()}만원`;
};
