import { api } from '@/apis/api';

export interface MentoringReviewItem {
    reviewIdx: number;
    menteeName: string;
    rating: number;
    reviewContent: string;
    createdAt: string; // ISO string
}

export interface MentoringReviewsResponse {
    productIdx: number;
    averageRating: number;
    reviewCount: number;
    reviews: MentoringReviewItem[];
    pageInfo: {
        nextCursor?: string;
        hasMore: boolean;
    };
}

function normalizeReview(raw: any): MentoringReviewItem {
    return {
        reviewIdx: raw?.review_idx ?? raw?.reviewIdx ?? 0,
        menteeName: raw?.mentee_name ?? raw?.menteeName ?? '익명',
        rating: raw?.rating ?? 0,
        reviewContent: raw?.review_content ?? raw?.reviewContent ?? '',
        createdAt: raw?.created_at ?? raw?.createdAt ?? '',
    };
}

export async function getMentoringProductReviews(params: {
    productIdx: number | string;
    limit?: number;
    cursor?: string;
}): Promise<MentoringReviewsResponse> {
    const { productIdx, limit = 10, cursor } = params;
    const search = new URLSearchParams({ limit: String(limit) });
    if (cursor) search.set('cursor', cursor);

    const res = await api.get(
        `/mentoring-products/${productIdx}/reviews?${search.toString()}`,
    );
    const data = res.data;

    return {
        productIdx: data?.product_idx ?? data?.productIdx ?? Number(productIdx),
        averageRating: data?.average_rating ?? data?.averageRating ?? 0,
        reviewCount: data?.review_count ?? data?.reviewCount ?? (data?.reviews?.length ?? 0),
        reviews: Array.isArray(data?.reviews) ? data.reviews.map(normalizeReview) : [],
        pageInfo: {
            nextCursor: data?.page_info?.next_cursor ?? data?.pageInfo?.nextCursor,
            hasMore: data?.page_info?.has_more ?? data?.pageInfo?.hasMore ?? false,
        },
    };
}

