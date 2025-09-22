export interface CoachingResumeResult {
    id: string;
    title: string;
    company: string;
    position: string;
    date: string;
    score: number;
    status: 'completed' | 'in-progress';
    feedback: {
        overall: string;
        strengths: string[];
        improvements: string[];
    };
}

// 데이터베이스 스키마에 맞는 새로운 타입 정의
export interface CoachingResumeSession {
    session_idx: number;
    user_idx: number;
    title: string;
    company: string;
    position: string;
    resume_file_url?: string;
    job_category_id?: number;
    job_role_id?: number;
    status: 'in-progress' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
    completed_at?: string;
}

export interface CoachingResumeResultDB {
    result_idx: number;
    session_idx: number;
    overall_score: number;
    overall_feedback: string;
    created_at: string;
    updated_at: string;
}

export interface CoachingResumeStrength {
    strength_idx: number;
    result_idx: number;
    strength_content: string;
    order_index: number;
    created_at: string;
}

export interface CoachingResumeImprovement {
    improvement_idx: number;
    result_idx: number;
    improvement_content: string;
    order_index: number;
    created_at: string;
}

export interface CoachingResumeEvaluationCriteria {
    criteria_idx: number;
    result_idx: number;
    criteria_name: string;
    criteria_score: number;
    criteria_feedback?: string;
    order_index: number;
    created_at: string;
}

// 조인된 결과를 위한 타입
export interface CoachingResumeResultWithDetails extends CoachingResumeSession {
    result?: CoachingResumeResultDB;
    strengths?: CoachingResumeStrength[];
    improvements?: CoachingResumeImprovement[];
    evaluation_criteria?: CoachingResumeEvaluationCriteria[];
}

// 새로운 API 구조를 위한 인터페이스
export interface MentoringApplication {
    application_id: number;
    canvas_id: string;
    product_idx: number;
    product_title: string;
    booked_date: string;
    application_status: 'approved' | 'pending' | 'rejected';
    start_time: string;
    end_time: string;
    mentee: {
        user_idx: number;
        name: string;
        profile_img: string;
    };
    mentor: {
        mentor_idx: number;
        business_name: string;
        job_category: string;
    };
}

export interface MentoringApplicationResponse {
    applications: MentoringApplication[];
    page_info: {
        page: number;
        limit: number;
        total: number;
        has_next: boolean;
    };
}

export const mockCoachingResumeResults: CoachingResumeResult[] = [
    {
        id: '1',
        title: '프론트엔드 개발자 이력서',
        company: '카카오',
        position: '시니어 프론트엔드 개발자',
        date: '2024-01-15',
        score: 88,
        status: 'completed',
        feedback: {
            overall:
                '기술 스택과 프로젝트 경험이 잘 정리되어 있습니다. 다만 성과 중심의 서술이 더 필요합니다.',
            strengths: ['기술 스택 명시', '프로젝트 경험', 'GitHub 링크'],
            improvements: ['성과 지표 추가', '문제 해결 과정', '팀 기여도'],
        },
    },
    {
        id: '2',
        title: '풀스택 개발자 이력서',
        company: '네이버',
        position: '풀스택 개발자',
        date: '2024-01-12',
        score: 82,
        status: 'completed',
        feedback: {
            overall:
                '풀스택 경험이 잘 드러나고 있습니다. 백엔드와 프론트엔드 경험의 균형이 좋습니다.',
            strengths: ['풀스택 경험', '다양한 기술 스택', '프로젝트 규모'],
            improvements: ['아키텍처 설계', '성능 개선 사례', '리더십 경험'],
        },
    },
    {
        id: '3',
        title: 'React 개발자 이력서',
        company: '당근마켓',
        position: 'React 개발자',
        date: '2024-01-10',
        score: 91,
        status: 'completed',
        feedback: {
            overall:
                'React 생태계에 대한 깊은 이해가 잘 드러납니다. 오픈소스 기여도가 인상적입니다.',
            strengths: ['React 전문성', '오픈소스 기여', '성능 최적화'],
            improvements: ['팀 프로젝트 경험', '코드 리뷰', '멘토링'],
        },
    },
    {
        id: '4',
        title: 'Vue.js 개발자 이력서',
        company: '토스',
        position: 'Vue.js 개발자',
        date: '2024-01-08',
        score: 76,
        status: 'completed',
        feedback: {
            overall:
                'Vue.js 기본기는 있지만 고급 기능에 대한 경험이 부족합니다. 프로젝트를 더 다양하게 경험해보세요.',
            strengths: ['Vue.js 기본', '컴포넌트 설계', '상태 관리'],
            improvements: ['Vue 3 경험', 'TypeScript', '테스팅'],
        },
    },
    {
        id: '5',
        title: 'Node.js 백엔드 이력서',
        company: '라인',
        position: 'Node.js 백엔드 개발자',
        date: '2024-01-05',
        score: 85,
        status: 'completed',
        feedback: {
            overall:
                'Node.js와 관련 기술에 대한 이해도가 높습니다. 대용량 트래픽 처리 경험이 인상적입니다.',
            strengths: ['Node.js 전문성', '대용량 처리', 'API 설계'],
            improvements: ['마이크로서비스', '클라우드 경험', '모니터링'],
        },
    },
];
