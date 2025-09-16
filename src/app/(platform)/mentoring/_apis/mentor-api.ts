import { api } from '@/apis/api';

// 직무 카테고리 타입 정의
export interface JobCategory {
    id: number;
    name: string;
}

// 멘토 지원 요청 데이터 타입
export interface CreateMentorApplicationDto {
    contact_email: string;
    business_name: string;
    contact_phone: string;
    preferred_field_id: number;
    introduction: string;
    portfolio_link?: string;
}

// 멘토 지원 응답 타입
export interface MentorApplicationResponse {
    success: boolean;
    message: string;
    mentor_idx?: number;
}

// 직무 카테고리 조회 응답 타입
export interface JobCategoriesResponse {
    categories: JobCategory[];
}

/**
 * 직무 카테고리 목록을 조회합니다.
 */
export const getJobCategories = async (): Promise<JobCategory[]> => {
    try {
        const response = await api.get<JobCategoriesResponse>(
            '/mentor-applications/job-categories',
        );
        return response.data.categories;
    } catch (error) {
        console.error('직무 카테고리 조회 실패:', error);
        throw new Error('직무 카테고리를 불러오는데 실패했습니다.');
    }
};

/**
 * 멘토 지원을 제출합니다.
 */
export const createMentorApplication = async (
    data: CreateMentorApplicationDto,
): Promise<MentorApplicationResponse> => {
    try {
        const response = await api.post<MentorApplicationResponse>('/mentor-applications', data);
        return response.data;
    } catch (error) {
        console.error('멘토 지원 실패:', error);
        throw new Error('멘토 지원 중 오류가 발생했습니다.');
    }
};
