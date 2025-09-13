const BASE_URL = process.env.NEXT_PUBLIC_API_BASE!;

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

export type MentoringProductsResponse = {
    products: MentoringProduct[];
    page_info: {
        page: number;
        limit: number;
        total: number;
        has_next: boolean;
    };
};

// 더미 데이터
const mockProducts: MentoringProduct[] = [
    {
        product_idx: 1,
        title: '프론트엔드 면접 대비 1:1 멘토링',
        description: '실제 면접 경험 기반으로 포트폴리오와 코딩테스트 준비를 도와드립니다.',
        price: 50000,
        job_category: '프론트엔드 개발',
        mentee_count: 8,
        review_count: 12,
        average_rating: 4.8,
        mentor: {
            name: '홍길동',
            job_category: '프론트엔드 개발',
            career: '5년차',
            business_name: '네이버',
        },
    },
    {
        product_idx: 2,
        title: 'React & TypeScript 실무 프로젝트 리뷰',
        description: '실제 프로젝트 코드를 기반으로 리팩토링과 최적화 방법을 알려드립니다.',
        price: 80000,
        job_category: '프론트엔드 개발',
        mentee_count: 15,
        review_count: 8,
        average_rating: 4.6,
        mentor: {
            name: '김리액트',
            job_category: '프론트엔드 개발',
            career: '7년차',
            business_name: '카카오',
        },
    },
    {
        product_idx: 3,
        title: '백엔드 아키텍처 설계 멘토링',
        description: '확장 가능한 백엔드 시스템 설계와 마이크로서비스 아키텍처를 학습합니다.',
        price: 100000,
        job_category: '백엔드 개발',
        mentee_count: 12,
        review_count: 6,
        average_rating: 4.9,
        mentor: {
            name: '이서버',
            job_category: '백엔드 개발',
            career: '8년차',
            business_name: '당근마켓',
        },
    },
    {
        product_idx: 4,
        title: '데이터베이스 최적화 및 성능 튜닝',
        description: 'MySQL, PostgreSQL을 활용한 쿼리 최적화와 인덱싱 전략을 배웁니다.',
        price: 120000,
        job_category: '백엔드 개발',
        mentee_count: 6,
        review_count: 4,
        average_rating: 4.7,
        mentor: {
            name: '박데이터',
            job_category: '백엔드 개발',
            career: '10년차',
            business_name: '토스',
        },
    },
    {
        product_idx: 5,
        title: 'UI/UX 디자인 시스템 구축 가이드',
        description: 'Figma를 활용한 디자인 시스템 구축과 컴포넌트 설계 방법을 학습합니다.',
        price: 70000,
        job_category: 'UI/UX 디자인',
        mentee_count: 20,
        review_count: 15,
        average_rating: 4.5,
        mentor: {
            name: '정디자인',
            job_category: 'UI/UX 디자인',
            career: '6년차',
            business_name: '라인',
        },
    },
    {
        product_idx: 6,
        title: 'DevOps CI/CD 파이프라인 구축',
        description: 'Docker, Kubernetes, GitHub Actions를 활용한 자동화 배포 환경을 구축합니다.',
        price: 150000,
        job_category: 'DevOps',
        mentee_count: 9,
        review_count: 7,
        average_rating: 4.8,
        mentor: {
            name: '한인프라',
            job_category: 'DevOps',
            career: '9년차',
            business_name: '우아한형제들',
        },
    },
    {
        product_idx: 7,
        title: '모바일 앱 개발 (React Native)',
        description: '크로스 플랫폼 모바일 앱 개발과 네이티브 모듈 연동 방법을 학습합니다.',
        price: 90000,
        job_category: '모바일 개발',
        mentee_count: 14,
        review_count: 10,
        average_rating: 4.4,
        mentor: {
            name: '송모바일',
            job_category: '모바일 개발',
            career: '5년차',
            business_name: '쿠팡',
        },
    },
    {
        product_idx: 8,
        title: 'AI/ML 모델 개발 및 배포',
        description: 'TensorFlow, PyTorch를 활용한 머신러닝 모델 개발과 MLOps 파이프라인 구축',
        price: 200000,
        job_category: 'AI/ML',
        mentee_count: 5,
        review_count: 3,
        average_rating: 4.9,
        mentor: {
            name: '강AI',
            job_category: 'AI/ML',
            career: '12년차',
            business_name: '네이버',
        },
    },
];

// 상품 목록 조회 (더미 데이터 사용)
export async function fetchMentoringProducts(
    page = 1,
    limit = 10,
): Promise<MentoringProductsResponse> {
    try {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = mockProducts.slice(startIndex, endIndex);

        return {
            products: paginatedProducts,
            page_info: {
                page,
                limit,
                total: mockProducts.length,
                has_next: endIndex < mockProducts.length,
            },
        };
    } catch (error) {
        console.error('멘토링 상품 목록 조회 실패:', error);
        throw new Error('멘토링 상품 목록을 불러오는데 실패했습니다.');
    }
}
