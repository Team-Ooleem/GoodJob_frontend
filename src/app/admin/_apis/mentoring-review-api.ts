const BASE_URL = process.env.NEXT_PUBLIC_API_BASE!;

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
    reviews: MentoringReview[];
    page_info: {
        page: number;
        limit: number;
        total: number;
        has_next: boolean;
    };
};

// 멘토링 리뷰 목록 조회 (임시 구현)
export async function fetchMentoringReviews(
    page = 1,
    limit = 10,
): Promise<MentoringReviewsResponse> {
    try {
        // 임시 예시 데이터
        const mockReviews: MentoringReview[] = [
            {
                review_idx: 1,
                product_idx: 1,
                product_title: '프론트엔드 면접 대비 1:1 멘토링',
                mentee: {
                    user_idx: 20,
                    name: '김민수',
                    profile_img: 'https://cdn.example.com/profiles/20.png',
                },
                rating: 5,
                review_content: '멘토님이 실제 면접에서 유용한 팁을 많이 알려주셨어요!',
                created_at: '2024-01-15T10:30:00Z',
            },
            {
                review_idx: 2,
                product_idx: 1,
                product_title: '프론트엔드 면접 대비 1:1 멘토링',
                mentee: {
                    user_idx: 21,
                    name: '이영희',
                    profile_img: 'https://cdn.example.com/profiles/21.png',
                },
                rating: 4,
                review_content: '포트폴리오 피드백이 정말 도움이 되었습니다.',
                created_at: '2024-01-16T14:20:00Z',
            },
            {
                review_idx: 3,
                product_idx: 2,
                product_title: 'React & TypeScript 실무 프로젝트 리뷰',
                mentee: {
                    user_idx: 22,
                    name: '박개발',
                    profile_img: 'https://cdn.example.com/profiles/22.png',
                },
                rating: 5,
                review_content: '코드 리뷰가 매우 상세하고 실무에 도움이 많이 되었어요.',
                created_at: '2024-01-17T09:15:00Z',
            },
            {
                review_idx: 4,
                product_idx: 2,
                product_title: 'React & TypeScript 실무 프로젝트 리뷰',
                mentee: {
                    user_idx: 23,
                    name: '최코딩',
                    profile_img: 'https://cdn.example.com/profiles/23.png',
                },
                rating: 3,
                review_content: '시간이 조금 부족했지만 전반적으로 만족합니다.',
                created_at: '2024-01-18T16:45:00Z',
            },
            {
                review_idx: 5,
                product_idx: 3,
                product_title: '백엔드 아키텍처 설계 멘토링',
                mentee: {
                    user_idx: 24,
                    name: '정서버',
                    profile_img: 'https://cdn.example.com/profiles/24.png',
                },
                rating: 5,
                review_content: '아키텍처 설계에 대한 깊이 있는 조언을 받을 수 있어서 좋았습니다.',
                created_at: '2024-01-19T11:30:00Z',
            },
        ];

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedReviews = mockReviews.slice(startIndex, endIndex);

        return {
            reviews: paginatedReviews,
            page_info: {
                page,
                limit,
                total: mockReviews.length,
                has_next: endIndex < mockReviews.length,
            },
        };
    } catch (error) {
        console.error('멘토링 리뷰 목록 조회 실패:', error);
        throw new Error('멘토링 리뷰 목록을 불러오는데 실패했습니다.');
    }
}
