import type { Application } from '../_apis/mentoring-application-api';

export const mockReservationData: Application[] = [
    {
        application_id: 1,
        product_idx: 1,
        mentee: {
            user_idx: 1,
            name: '김민수',
            profile_img:
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        },
        mentor: {
            mentor_idx: 1,
            business_name: '테크스타트업',
            job_category: '프론트엔드',
        },
        product_title: '프론트엔드 개발자 취업 준비 멘토링',
        booked_date: '2025-01-15',
        application_status: 'pending',
    },
    {
        application_id: 2,
        product_idx: 2,
        mentee: {
            user_idx: 2,
            name: '이지은',
            profile_img:
                'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        },
        mentor: {
            mentor_idx: 1,
            business_name: '테크스타트업',
            job_category: '백엔드',
        },
        product_title: '백엔드 개발자 면접 준비 특강',
        booked_date: '2025-01-16',
        application_status: 'pending',
    },
    {
        application_id: 3,
        product_idx: 3,
        mentee: {
            user_idx: 3,
            name: '박준호',
        },
        mentor: {
            mentor_idx: 2,
            business_name: '빅데이터 회사',
            job_category: '데이터사이언스',
        },
        product_title: '데이터 사이언티스트 포트폴리오 리뷰',
        booked_date: '2025-01-17',
        application_status: 'approved',
    },
    {
        application_id: 4,
        product_idx: 4,
        mentee: {
            user_idx: 4,
            name: '최유진',
            profile_img:
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
        },
        mentor: {
            mentor_idx: 3,
            business_name: '디자인 에이전시',
            job_category: 'UI/UX',
        },
        product_title: 'UI/UX 디자이너 포트폴리오 피드백',
        booked_date: '2025-01-18',
        application_status: 'rejected',
    },
    {
        application_id: 5,
        product_idx: 5,
        mentee: {
            user_idx: 5,
            name: '정수현',
            profile_img:
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
        },
        mentor: {
            mentor_idx: 1,
            business_name: '테크스타트업',
            job_category: '풀스택',
        },
        product_title: '풀스택 개발자 취업 전략 상담',
        booked_date: '2025-01-19',
        application_status: 'completed',
    },
    {
        application_id: 6,
        product_idx: 6,
        mentee: {
            user_idx: 6,
            name: '한소영',
        },
        mentor: {
            mentor_idx: 4,
            business_name: '클라우드 회사',
            job_category: 'DevOps',
        },
        product_title: 'DevOps 엔지니어 기술 면접 준비',
        booked_date: '2025-01-20',
        application_status: 'pending',
    },
    {
        application_id: 7,
        product_idx: 7,
        mentee: {
            user_idx: 7,
            name: '윤태호',
            profile_img:
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
        },
        mentor: {
            mentor_idx: 5,
            business_name: '모바일 앱 회사',
            job_category: '모바일',
        },
        product_title: '모바일 앱 개발자 취업 준비',
        booked_date: '2025-01-21',
        application_status: 'cancelled',
    },
    {
        application_id: 8,
        product_idx: 8,
        mentee: {
            user_idx: 8,
            name: '강미래',
            profile_img:
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face',
        },
        mentor: {
            mentor_idx: 6,
            business_name: 'AI 스타트업',
            job_category: 'AI/ML',
        },
        product_title: 'AI/ML 엔지니어 포트폴리오 리뷰',
        booked_date: '2025-01-22',
        application_status: 'pending',
    },
];

export const mockPageInfo = {
    page: 1,
    limit: 10,
    total: 8,
    total_pages: 1,
    has_next: false,
};
