import { api } from '@/apis/api';

// 멘토링 상품 타입 정의
export interface Mentor {
    nickname: string;
    profile: string;
    profile_img: string;
    info: string[];
}

export interface MentoringProduct {
    product_idx: number;
    title: string;
    mentor: Mentor;
    rating: number;
    participants: number;
    price: number;
}

export interface MentoringProductsResponse {
    products: MentoringProduct[];
    next_cursor?: string;
    has_more: boolean;
    total_count: number;
}

export interface MentoringProductsParams {
    cursor?: string;
}

/**
 * 멘토링 상품 리스트 조회 (무한스크롤)
 */
export const getMentoringProducts = async (
    params: MentoringProductsParams = {},
): Promise<MentoringProductsResponse> => {
    const searchParams = new URLSearchParams();

    // 기본값 설정
    const { cursor } = params;

    // 쿼리 파라미터 추가
    if (cursor) searchParams.append('cursor', cursor);

    const response = await api.get(`/mentoring-products?${searchParams.toString()}`);
    return response.data;
};
