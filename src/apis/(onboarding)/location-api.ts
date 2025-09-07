import { api } from '../api';
import {
    SidoResponse,
    GuResponse,
    AllLocationsResponse,
    UserLocationPreference,
    UserLocationPreferenceResponse,
} from '@/types/types';

/**
 * 시도 목록을 조회합니다.
 * @returns 시도 목록 응답
 */
export const getSidoList = async (): Promise<SidoResponse> => {
    try {
        const response = await api.get<SidoResponse>('/locations/sido');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 특정 시도의 구/군 목록을 조회합니다.
 * @param sidoCode 시도 코드 (2자리)
 * @returns 구/군 목록 응답
 */
export const getGuList = async (sidoCode: string): Promise<GuResponse> => {
    try {
        const response = await api.get<GuResponse>(`/locations/gu/${sidoCode}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 모든 지역 정보를 시도별로 그룹화하여 조회합니다.
 * @returns 모든 지역 정보 응답
 */
export const getAllLocations = async (): Promise<AllLocationsResponse> => {
    try {
        const response = await api.get<AllLocationsResponse>('/locations/all');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 사용자의 희망 근무지를 저장합니다.
 * @param preference 사용자 희망 근무지 선호도
 * @returns 저장 결과 응답
 */
export const saveUserLocationPreference = async (
    preference: UserLocationPreference,
): Promise<UserLocationPreferenceResponse> => {
    try {
        const response = await api.post<UserLocationPreferenceResponse>(
            '/user/location-preference',
            preference,
        );
        return response.data;
    } catch (error) {
        throw error;
    }
};
