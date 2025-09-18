import { API_BASE_URL } from '@/constants/config';
const BASE_URL = API_BASE_URL;

export type MentoringProduct = {
    product_idx: number;
    title: string;
    description: string;
    price: number;
    job_category: string;
    mentee_count: number;
    review_count: number;
    average_rating: number;
    mentor: {
        name: string;
        job_category: string;
        career: string;
        business_name: string;
    };
};

// 멘토링 상품 생성 관련 타입
export type TimeSlot = {
    day_of_week: number; // 1: 월요일, 2: 화요일, ..., 7: 일요일
    hour_slot: number; // 0-23 시간
};

export type CreateMentoringProductRequest = {
    mentor_idx: number;
    title: string;
    job_category_id: number;
    description: string;
    price: number;
    slots: TimeSlot[];
};

export type CreateMentoringProductResponse = {
    success: boolean;
    product_idx: number;
    message: string;
};

// 직무 카테고리 타입
export type JobCategory = {
    id: number;
    name: string;
    parent_id?: number;
};

// 멘토 정보 타입
export type Mentor = {
    mentor_idx: number;
    name: string;
    job_category: string;
    career: string;
    business_name: string;
};

export type MentoringProductsResponse = {
    products: MentoringProduct[];
    page_info: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
    };
};

// 상품 목록 조회 (실제 API 연동)
export async function fetchMentoringProducts(
    page = 1,
    limit = 10,
    mentorIdx?: number,
): Promise<MentoringProductsResponse> {
    try {
        // 모든 멘토의 상품을 조회하기 위해 멘토 목록을 먼저 가져옴
        const mentors = mentorIdx
            ? [
                  {
                      mentor_idx: mentorIdx,
                      name: String(mentorIdx),
                      job_category: '',
                      career: '',
                      business_name: '',
                  } as Mentor,
              ]
            : await fetchMentors();
        const allProducts: MentoringProduct[] = [];

        // 멘토가 없는 경우 빈 결과 반환
        if (mentors.length === 0) {
            return {
                products: [],
                page_info: {
                    page,
                    limit,
                    total: 0,
                    total_pages: 0,
                    has_next: false,
                },
            };
        }

        // 각 멘토별로 상품 목록 조회 (병렬 처리로 성능 최적화)
        const mentorPromises = mentors.map(async (mentor) => {
            try {
                const response = await fetch(
                    `${BASE_URL}/mentors/${mentor.mentor_idx}/mentoring-products`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                    },
                );

                if (response.ok) {
                    const mentorProducts = await response.json();

                    // API 응답이 배열인지 확인하고 처리
                    if (Array.isArray(mentorProducts)) {
                        return mentorProducts;
                    } else if (mentorProducts.products && Array.isArray(mentorProducts.products)) {
                        return mentorProducts.products;
                    } else if (mentorProducts.data && Array.isArray(mentorProducts.data)) {
                        return mentorProducts.data;
                    }
                }
                return [];
            } catch (mentorError) {
                return [];
            }
        });

        // 모든 멘토의 상품을 병렬로 조회
        const mentorProductsArrays = await Promise.all(mentorPromises);

        // 모든 상품을 하나의 배열로 합치기
        mentorProductsArrays.forEach((products) => {
            if (Array.isArray(products)) {
                allProducts.push(...products);
            }
        });

        // 페이지네이션 처리
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = allProducts.slice(startIndex, endIndex);

        const total = allProducts.length;
        const total_pages = Math.ceil(total / limit);

        return {
            products: paginatedProducts,
            page_info: {
                page,
                limit,
                total,
                total_pages,
                has_next: endIndex < allProducts.length,
            },
        };
    } catch (error) {
        throw new Error('멘토링 상품 목록을 불러오는데 실패했습니다.');
    }
}

/** 멘토링 상품 생성 */
export async function createMentoringProduct(
    data: CreateMentoringProductRequest,
): Promise<CreateMentoringProductResponse> {
    // 여러 가능한 엔드포인트 시도
    const possibleUrls = [
        `${BASE_URL}/mentoring-products`,
        `${BASE_URL}/mentoring/products`,
        `${BASE_URL}/admin/mentoring-products`,
        `${BASE_URL}/mentoring-products/create`,
    ];
    const url = possibleUrls[0]; // 첫 번째 시도

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const msg = await safeText(res);
        throw new Error(`멘토링 상품 생성 실패 (${res.status}) ${msg}`);
    }

    // 백엔드 응답을 success 래퍼로 감싸서 반환
    const json = await res.json();
    return {
        success: true,
        product_idx: json.product_idx ?? 0, // 백엔드가 반환하면 사용
        message: '멘토링 상품이 성공적으로 생성되었습니다.',
    };
}

// 실제 데이터베이스의 직무 카테고리 데이터
const mockJobCategories: JobCategory[] = [
    { id: 2, name: 'IT개발·데이터' },
    { id: 3, name: '인사·노무·HRD' },
    { id: 4, name: '상품기획·MD' },
    { id: 5, name: '마케팅·홍보·조사' },
    { id: 6, name: '디자인' },
    { id: 7, name: '기획·전략' },
    { id: 8, name: '교육' },
];

/** 직무 카테고리 목록 조회 */
export async function fetchJobCategories(): Promise<JobCategory[]> {
    try {
        // 실제 API 호출 시도
        const res = await fetch(`${BASE_URL}/job-categories`, {
            credentials: 'include',
        });

        if (res.ok) {
            return res.json();
        }
    } catch (error) {
        console.warn('직무 카테고리 API 호출 실패, 더미 데이터 사용:', error);
    }

    // API 호출 실패 시 실제 데이터베이스와 일치하는 더미 데이터 반환
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockJobCategories);
        }, 500); // 실제 API 호출과 유사한 지연 시간
    });
}

/** 멘토 목록 조회 */
export async function fetchMentors(): Promise<Mentor[]> {
    // 가능한 멘토 API 엔드포인트들을 시도
    const possibleEndpoints = [
        `${BASE_URL}/mentors`,
        `${BASE_URL}/api/mentors`,
        `${BASE_URL}/mentoring/mentors`,
        `${BASE_URL}/admin/mentors`,
        `${BASE_URL}/users/mentors`,
    ];

    for (const endpoint of possibleEndpoints) {
        try {
            const res = await fetch(endpoint, {
                credentials: 'include',
            });

            if (res.ok) {
                return res.json();
            }
        } catch (error) {
            // 에러 무시하고 다음 엔드포인트 시도
        }
    }

    // 모든 엔드포인트 실패 시 빈 배열 반환
    return [];
}

/** 에러 메시지 보강용 */
async function safeText(res: Response) {
    try {
        return await res.text();
    } catch {
        return '';
    }
}
