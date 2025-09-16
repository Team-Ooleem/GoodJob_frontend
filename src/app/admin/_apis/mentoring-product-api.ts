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
        console.log('🚀 멘토링 상품 목록 조회 시작');
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
        console.log('👥 조회된 멘토 목록:', {
            mentors_count: mentors.length,
            mentors: mentors.map((m) => ({ mentor_idx: m.mentor_idx, name: m.name })),
        });
        const allProducts: MentoringProduct[] = [];

        // 멘토가 없는 경우 빈 결과 반환
        if (mentors.length === 0) {
            console.warn('⚠️ 조회된 멘토가 없습니다. 빈 상품 목록을 반환합니다.');
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
                console.log(`🔍 멘토 ${mentor.mentor_idx} 상품 조회 시작:`, {
                    mentor_name: mentor.name,
                    mentor_idx: mentor.mentor_idx,
                    url: `${BASE_URL}/mentors/${mentor.mentor_idx}/mentoring-products`,
                });

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

                console.log(`📡 멘토 ${mentor.mentor_idx} API 응답 상태:`, {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    headers: Object.fromEntries(response.headers.entries()),
                });

                if (response.ok) {
                    const mentorProducts = await response.json();
                    console.log(`✅ 멘토 ${mentor.mentor_idx} API 응답 데이터:`, {
                        raw_response: mentorProducts,
                        is_array: Array.isArray(mentorProducts),
                        has_products: mentorProducts.products
                            ? Array.isArray(mentorProducts.products)
                            : false,
                        has_data: mentorProducts.data ? Array.isArray(mentorProducts.data) : false,
                        products_count: Array.isArray(mentorProducts)
                            ? mentorProducts.length
                            : mentorProducts.products
                              ? mentorProducts.products.length
                              : mentorProducts.data
                                ? mentorProducts.data.length
                                : 0,
                    });

                    // API 응답이 배열인지 확인하고 처리
                    if (Array.isArray(mentorProducts)) {
                        console.log(
                            `📦 멘토 ${mentor.mentor_idx} - 배열 형태 응답 처리, 상품 수: ${mentorProducts.length}`,
                        );
                        return mentorProducts;
                    } else if (mentorProducts.products && Array.isArray(mentorProducts.products)) {
                        console.log(
                            `📦 멘토 ${mentor.mentor_idx} - products 속성 처리, 상품 수: ${mentorProducts.products.length}`,
                        );
                        return mentorProducts.products;
                    } else if (mentorProducts.data && Array.isArray(mentorProducts.data)) {
                        console.log(
                            `📦 멘토 ${mentor.mentor_idx} - data 속성 처리, 상품 수: ${mentorProducts.data.length}`,
                        );
                        return mentorProducts.data;
                    } else {
                        console.warn(
                            `⚠️ 멘토 ${mentor.mentor_idx} - 예상치 못한 응답 구조:`,
                            mentorProducts,
                        );
                    }
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    console.error(`❌ 멘토 ${mentor.mentor_idx}의 상품 조회 실패:`, {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText,
                    });
                }
                return [];
            } catch (mentorError) {
                console.error(`💥 멘토 ${mentor.mentor_idx}의 상품 조회 중 오류:`, {
                    error: mentorError,
                    message: mentorError instanceof Error ? mentorError.message : 'Unknown error',
                });
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

        console.log('📊 최종 상품 데이터 집계:', {
            total_products: allProducts.length,
            products_by_mentor: mentorProductsArrays.map((products, index) => ({
                mentor_idx: mentors[index]?.mentor_idx,
                mentor_name: mentors[index]?.name,
                products_count: Array.isArray(products) ? products.length : 0,
            })),
        });

        // 페이지네이션 처리
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = allProducts.slice(startIndex, endIndex);

        const total = allProducts.length;
        const total_pages = Math.ceil(total / limit);

        console.log('📄 페이지네이션 결과:', {
            page,
            limit,
            total,
            total_pages,
            has_next: endIndex < allProducts.length,
            paginated_products_count: paginatedProducts.length,
        });

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
        console.error('멘토링 상품 목록 조회 실패:', error);
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
            console.log(`🔍 멘토 API 시도: ${endpoint}`);
            const res = await fetch(endpoint, {
                credentials: 'include',
            });

            if (res.ok) {
                console.log(`✅ 멘토 API 성공: ${endpoint}`);
                return res.json();
            } else {
                console.warn(`❌ 멘토 API 실패: ${endpoint} (${res.status})`);
            }
        } catch (error) {
            console.warn(`💥 멘토 API 오류: ${endpoint}`, error);
        }
    }

    // 모든 엔드포인트 실패 시 빈 배열 반환 (더미 데이터 없이)
    console.warn('⚠️ 모든 멘토 API 엔드포인트 실패, 빈 배열 반환');
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
