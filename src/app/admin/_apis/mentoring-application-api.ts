const BASE_URL = process.env.NEXT_PUBLIC_API_BASE!;

export type Application = {
    application_id: number;
    product_idx: number;
    product_title: string;
    booked_date: string;
    application_status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    mentee: { user_idx: number; name: string; profile_img?: string };
    mentor: { mentor_idx: number; business_name: string; job_category: string };
};

export type PageInfo = {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
};

export type ApplicationsResponse = {
    applications: Application[];
    page_info: PageInfo;
};

// /** 예약 목록 조회 (실서버) */
// export async function fetchApplications(
//     userIdx: number,
//     page = 1,
//     limit = 10,
// ): Promise<ApplicationsResponse> {
//     const url = `${BASE_URL}/mentoring-applications/${userIdx}?page=${page}&limit=${limit}`;
//     const res = await fetch(url, { credentials: 'include' });

//     if (!res.ok) {
//         const msg = await safeText(res);
//         throw new Error(`예약 목록 조회 실패 (${res.status}) ${msg}`);
//     }
//     const data = await res.json();
//     // 서버 응답이 바로 ApplicationsResponse 형태라고 가정
//     return data as ApplicationsResponse;
// }

// /** 예약 상태 변경 (승인/거절) */
// export async function updateApplication(
//     applicationId: number,
//     payload: { application_status: 'approved' | 'rejected'; rejection_reason?: string },
// ) {
//     const res = await fetch(`${BASE_URL}/mentoring-applications/${applicationId}`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         credentials: 'include',
//         body: JSON.stringify(payload),
//     });

//     if (!res.ok) {
//         const msg = await safeText(res);
//         throw new Error(`예약 상태 변경 실패 (${res.status}) ${msg}`);
//     }
//     return res.json();
// }

// 더미 데이터
const mockApplications: Application[] = [
    {
        application_id: 1,
        product_idx: 1,
        product_title: '프론트엔드 면접 대비 1:1 멘토링',
        booked_date: '2024-01-20',
        application_status: 'pending',
        mentee: {
            user_idx: 20,
            name: '김민수',
            profile_img: 'https://cdn.example.com/profiles/20.png',
        },
        mentor: {
            mentor_idx: 1,
            business_name: '홍길동',
            job_category: '프론트엔드 개발',
        },
    },
    {
        application_id: 2,
        product_idx: 2,
        product_title: 'React & TypeScript 실무 프로젝트 리뷰',
        booked_date: '2024-01-22',
        application_status: 'approved',
        mentee: {
            user_idx: 21,
            name: '이영희',
            profile_img: 'https://cdn.example.com/profiles/21.png',
        },
        mentor: {
            mentor_idx: 2,
            business_name: '김리액트',
            job_category: '프론트엔드 개발',
        },
    },
    {
        application_id: 3,
        product_idx: 3,
        product_title: '백엔드 아키텍처 설계 멘토링',
        booked_date: '2024-01-25',
        application_status: 'rejected',
        mentee: {
            user_idx: 22,
            name: '박개발',
            profile_img: 'https://cdn.example.com/profiles/22.png',
        },
        mentor: {
            mentor_idx: 3,
            business_name: '이서버',
            job_category: '백엔드 개발',
        },
    },
    {
        application_id: 4,
        product_idx: 1,
        product_title: '프론트엔드 면접 대비 1:1 멘토링',
        booked_date: '2024-01-28',
        application_status: 'approved',
        mentee: {
            user_idx: 23,
            name: '최코딩',
            profile_img: 'https://cdn.example.com/profiles/23.png',
        },
        mentor: {
            mentor_idx: 1,
            business_name: '홍길동',
            job_category: '프론트엔드 개발',
        },
    },
    {
        application_id: 5,
        product_idx: 4,
        product_title: '데이터베이스 최적화 및 성능 튜닝',
        booked_date: '2024-01-30',
        application_status: 'pending',
        mentee: {
            user_idx: 24,
            name: '정서버',
            profile_img: 'https://cdn.example.com/profiles/24.png',
        },
        mentor: {
            mentor_idx: 4,
            business_name: '박데이터',
            job_category: '백엔드 개발',
        },
    },
    {
        application_id: 6,
        product_idx: 5,
        product_title: 'UI/UX 디자인 시스템 구축 가이드',
        booked_date: '2024-02-02',
        application_status: 'approved',
        mentee: {
            user_idx: 25,
            name: '한디자인',
            profile_img: 'https://cdn.example.com/profiles/25.png',
        },
        mentor: {
            mentor_idx: 5,
            business_name: '정디자인',
            job_category: 'UI/UX 디자인',
        },
    },
    {
        application_id: 7,
        product_idx: 6,
        product_title: 'DevOps CI/CD 파이프라인 구축',
        booked_date: '2024-02-05',
        application_status: 'pending',
        mentee: {
            user_idx: 26,
            name: '송인프라',
            profile_img: 'https://cdn.example.com/profiles/26.png',
        },
        mentor: {
            mentor_idx: 6,
            business_name: '한인프라',
            job_category: 'DevOps',
        },
    },
    {
        application_id: 8,
        product_idx: 7,
        product_title: '모바일 앱 개발 (React Native)',
        booked_date: '2024-02-08',
        application_status: 'approved',
        mentee: {
            user_idx: 27,
            name: '강모바일',
            profile_img: 'https://cdn.example.com/profiles/27.png',
        },
        mentor: {
            mentor_idx: 7,
            business_name: '송모바일',
            job_category: '모바일 개발',
        },
    },
];

/** 예약 목록 조회 (더미 데이터 사용) */
export async function fetchApplications(
    userIdx: number,
    page = 1,
    limit = 10,
): Promise<ApplicationsResponse> {
    try {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedApplications = mockApplications.slice(startIndex, endIndex);

        return {
            applications: paginatedApplications,
            page_info: {
                page,
                limit,
                total: mockApplications.length,
                has_next: endIndex < mockApplications.length,
            },
        };
    } catch (error) {
        console.error('예약 목록 조회 실패:', error);
        throw new Error('예약 목록을 불러오는데 실패했습니다.');
    }
}

/** 예약 상태 변경 (더미 구현) */
export async function updateApplication(
    applicationId: number,
    payload: { application_status: 'approved' | 'rejected'; rejection_reason?: string },
) {
    console.log(`예약 상태 변경: ${applicationId}`, payload);
    return { success: true };
}

/** 편의 함수: 승인/거절 래퍼 */
export const approveApplication = (id: number) =>
    updateApplication(id, { application_status: 'approved' });

export const rejectApplication = (id: number, reason: string) =>
    updateApplication(id, { application_status: 'rejected', rejection_reason: reason });

/** 에러 메시지 보강용 */
async function safeText(res: Response) {
    try {
        return await res.text();
    } catch {
        return '';
    }
}
