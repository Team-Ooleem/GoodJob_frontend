import { api } from './api';
import {
    JobCategoriesResponse,
    JobRolesResponse,
    UserJobPreference,
    UserJobPreferenceResponse,
} from '@/types/types';

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

/**
 * 사용자의 직군/직무 선호도를 조회합니다.
 * @returns 사용자 직군/직무 선호도 응답
 */
export const getUserJobPreference = async (): Promise<UserJobPreferenceResponse> => {
    try {
        const response = await api.get<UserJobPreferenceResponse>('/user/job-preference');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 사용자의 직군/직무 선호도를 저장합니다.
 * @param preference 사용자 직군/직무 선호도
 * @returns 저장 결과 응답
 */
export const saveUserJobPreference = async (
    preference: UserJobPreference,
): Promise<UserJobPreferenceResponse> => {
    try {
        const response = await api.post<UserJobPreferenceResponse>(
            '/user/job-preference',
            preference,
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
