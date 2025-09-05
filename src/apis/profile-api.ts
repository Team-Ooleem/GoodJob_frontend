import { api } from './api';
import { ProfileResponse, ProfileUpdateRequest, ProfileUpdateResponse } from '@/types/types';

/**
 * 사용자 프로필을 조회합니다.
 * @returns 프로필 응답
 */
export const getProfile = async (): Promise<ProfileResponse> => {
    try {
        const response = await api.get<ProfileResponse>('/profile');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 사용자 프로필을 업데이트합니다.
 * @param profileData 프로필 업데이트 데이터
 * @returns 프로필 업데이트 응답
 */
export const updateProfile = async (
    profileData: ProfileUpdateRequest,
): Promise<ProfileUpdateResponse> => {
    try {
        const response = await api.put<ProfileUpdateResponse>('/profile', profileData);
        return response.data;
    } catch (error) {
        throw error;
    }
};
