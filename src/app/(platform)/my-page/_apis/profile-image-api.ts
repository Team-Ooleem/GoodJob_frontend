import { api } from '@/apis/api';

export interface ProfileImageUploadResponse {
    success: boolean;
    message: string;
    profileImageUrl: string;
}

export const profileImageApi = {
    /**
     * 프로필 이미지 업로드
     * @param file 업로드할 이미지 파일
     * @returns 업로드된 이미지 URL
     */
    uploadProfileImage: async (file: File): Promise<ProfileImageUploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post<ProfileImageUploadResponse>(
            '/social/profile/me/image',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        );

        return response.data;
    },
};
