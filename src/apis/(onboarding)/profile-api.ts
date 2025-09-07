import { api } from '../api';
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
        const response = await api.put<ProfileUpdateResponse>('/profile/me', profileData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 프로필 이미지를 업로드합니다.
 * @param file 업로드할 이미지 파일
 * @returns 업로드 결과 응답
 */
export const uploadProfileImage = async (
    file: File,
): Promise<{ success: boolean; imageUrl?: string; message?: string }> => {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/profile/upload-image', formData);

        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 사용자의 온보딩 데이터를 조회합니다.
 * @returns 온보딩 데이터 응답
 */
export const getOnboardingData = async (): Promise<{
    success: boolean;
    data?: {
        desired_job: number;
        desired_sido: string;
        desired_gu: string;
        desired_salary: number;
    };
    message?: string;
}> => {
    try {
        const response = await api.get('/profile/onboarding-data');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * 온보딩을 완료합니다.
 * @param onboardingData 온보딩 데이터
 * @returns 온보딩 완료 응답
 */
export const completeOnboarding = async (onboardingData: {
    desired_job: number;
    desired_sido: string;
    desired_gu: string;
    desired_salary: number;
}): Promise<{ success: boolean; message?: string }> => {
    try {
        const response = await api.post('/profile/complete-onboarding', onboardingData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
