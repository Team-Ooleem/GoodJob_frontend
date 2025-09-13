import { api } from '@/apis/api';

// 정규화된 멘토링 상품 타입
export interface MentoringProduct {
    productIdx: number;
    title: string;
    content?: string;
    categoryName?: string;
    tags?: string[];
    price: number;
    ratingAverage?: number;
    reviewCount?: number;
    menteeCount?: number;
    mentor?: {
        name?: string;
        avatarUrl?: string | null;
        jobTitle?: string;
        seniority?: string;
        companyType?: string;
    };
}

function normalizeProduct(raw: any): MentoringProduct {
    const mentor = raw?.mentor || {};
    return {
        productIdx: raw?.product_idx ?? raw?.productIdx ?? raw?.id ?? 0,
        title: raw?.title ?? raw?.name ?? '',
        content: raw?.content ?? raw?.description ?? raw?.markdown ?? raw?.body ?? '',
        categoryName:
            raw?.category?.name ??
            raw?.category_name ??
            raw?.categoryName ??
            raw?.job_category,
        tags: raw?.tags ?? raw?.hash_tags ?? undefined,
        price: raw?.price ?? raw?.cost ?? 0,
        ratingAverage:
            raw?.rating?.average ??
            raw?.avg_rating ??
            raw?.average_rating ??
            raw?.rating ??
            undefined,
        reviewCount: raw?.rating?.count ?? raw?.review_count ?? raw?.reviewsCount ?? undefined,
        menteeCount: raw?.mentee_count ?? raw?.menteesCount ?? raw?.menteeCount ?? undefined,
        mentor: {
            name: mentor?.name ?? raw?.mentor_name,
            avatarUrl: mentor?.profileImage ?? mentor?.avatarUrl ?? raw?.mentor_avatar ?? null,
            jobTitle:
                mentor?.jobTitle ??
                mentor?.job_category ??
                mentor?.business_name ??
                raw?.mentor_job_title,
            seniority: mentor?.seniority ?? mentor?.career ?? raw?.mentor_seniority,
            companyType: mentor?.companyType ?? mentor?.business_name ?? raw?.mentor_company_type,
        },
    };
}

export async function getMentoringProduct(productIdx: number | string): Promise<MentoringProduct> {
    const response = await api.get(`/mentoring-products/${productIdx}`);
    return normalizeProduct(response.data);
}
