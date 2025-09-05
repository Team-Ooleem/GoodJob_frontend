import { api } from './api';
import { SalaryRangesResponse, SalaryRangeResponse, SalarySearchResponse } from '@/types/types';

/**
 * 모든 연봉 구간을 조회합니다.
 * @returns 연봉 구간 목록 응답
 */
export const getSalaryRanges = async (): Promise<SalaryRangesResponse> => {
    try {
        const response = await api.get<SalaryRangesResponse>('/salaries');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 특정 ID의 연봉 구간을 조회합니다.
 * @param id 연봉 구간 ID
 * @returns 연봉 구간 응답
 */
export const getSalaryRange = async (id: number): Promise<SalaryRangeResponse> => {
    try {
        const response = await api.get<SalaryRangeResponse>(`/salaries/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 최소 연봉 기준으로 연봉 구간을 검색합니다.
 * @param minSalary 최소 연봉 (만원 단위)
 * @returns 연봉 구간 목록 응답
 */
export const searchSalaryRangesByMin = async (minSalary: number): Promise<SalarySearchResponse> => {
    try {
        const response = await api.get<SalarySearchResponse>(
            `/salaries/search/min?min=${minSalary}`,
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 최대 연봉 기준으로 연봉 구간을 검색합니다.
 * @param maxSalary 최대 연봉 (만원 단위)
 * @returns 연봉 구간 목록 응답
 */
export const searchSalaryRangesByMax = async (maxSalary: number): Promise<SalarySearchResponse> => {
    try {
        const response = await api.get<SalarySearchResponse>(
            `/salaries/search/max?max=${maxSalary}`,
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
