import { api } from './api';
import { JobCategoriesResponse, JobRolesResponse } from '@/types/types';

/**
 * 직군 카테고리 목록을 조회합니다.
 * @returns 직군 카테고리 목록 응답
 */
export const getJobCategories = async (): Promise<JobCategoriesResponse> => {
    try {
        const response = await api.get<JobCategoriesResponse>('/jobs/categories');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 특정 직군의 직무 목록을 조회합니다.
 * @param categoryId 직군 카테고리 ID
 * @returns 직무 목록 응답
 */
export const getJobRoles = async (categoryId: number): Promise<JobRolesResponse> => {
    try {
        const response = await api.get<JobRolesResponse>(`/jobs/roles/${categoryId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
