// src/app/admin/_apis/mentoring-review-api.ts
import { API_BASE_URL } from '@/constants/config';
const BASE_URL = API_BASE_URL;

export type MentoringReview = {
    review_idx: number;
    product_idx: number;
    product_title: string;
    mentee: {
        user_idx: number;
        name: string;
        profile_img?: string;
    };
    rating: number;
    review_content: string;
    created_at: string;
};

export type MentoringReviewsResponse = {
    mentor_idx: number;
    review_count: number;
    average_rating: number;
    reviews: MentoringReview[];
    page_info: {
        page: number;
        limit: number;
        total_pages: number;
        has_next: boolean;
    };
};

/**
 * 관리자 리뷰 조회(멘토 단위)
 * Postman: GET /mentors/:mentor_idx/reviews?page=1&limit=20
 */
export async function fetchMentoringReviews(
    mentorIdx: number,
    page = 1,
    limit = 20,
): Promise<MentoringReviewsResponse> {
    if (!BASE_URL) throw new Error('API BASE_URL이 설정되지 않았습니다.');
    const url = `${BASE_URL}/mentors/${mentorIdx}/reviews?page=${page}&limit=${limit}`;

    const res = await fetch(url, {
        credentials: 'include', // 쿠키 기반 인증을 사용하는 경우
        // headers: { Authorization: `Bearer ${token}` } // 토큰 인증이면 주석 해제
    });

    if (!res.ok) {
        let msg = '관리자 리뷰 목록 조회 실패';
        try {
            const err = (await res.json()) as { message?: string };
            if (err?.message) msg = `관리자 리뷰 목록 조회 실패: ${err.message}`;
        } catch (_) {}
        throw new Error(msg);
    }

    const json = (await res.json()) as {
        mentor_idx: number;
        review_count: number;
        average_rating?: number;
        page_info: { page: number; limit: number; total_pages?: number; has_next: boolean };
        reviews: Array<{
            review_idx: number;
            product_idx: number;
            product_title: string;
            mentee: { user_idx: number; name: string; profile_img?: string };
            rating: number;
            review_content: string;
            created_at: string;
        }>;
    };

    return {
        mentor_idx: json.mentor_idx,
        review_count: json.review_count,
        average_rating: json.average_rating ?? 0,
        reviews: json.reviews.map((r) => ({
            review_idx: r.review_idx,
            product_idx: r.product_idx,
            product_title: r.product_title,
            mentee: {
                user_idx: r.mentee.user_idx,
                name: r.mentee.name,
                profile_img: r.mentee.profile_img,
            },
            rating: r.rating,
            review_content: r.review_content,
            created_at: r.created_at,
        })),
        page_info: {
            page: json.page_info?.page ?? page,
            limit: json.page_info?.limit ?? limit,
            total_pages: json.page_info?.total_pages ?? 1,
            has_next: json.page_info?.has_next ?? false,
        },
    };
}
