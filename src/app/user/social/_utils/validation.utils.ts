/**
 * 유효성 검사 관련 유틸리티 함수들
 */

/**
 * 이미지 파일 유효성 검사
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
    // 파일 크기 제한 (20MB)
    if (file.size > 20 * 1024 * 1024) {
        return { isValid: false, error: '이미지 크기는 20MB 이하로 업로드해주세요.' };
    }

    // 허용되는 이미지 형식 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'JPEG, PNG, GIF, WebP 형식의 이미지만 업로드 가능합니다.',
        };
    }

    return { isValid: true };
};

/**
 * 텍스트 길이 유효성 검사
 */
export const validateTextLength = (text: string, maxLength: number = 500): boolean => {
    return text.length <= maxLength;
};
