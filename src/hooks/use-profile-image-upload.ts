import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    profileImageApi,
    ProfileImageUploadResponse,
} from '@/app/(platform)/my-page/_apis/profile-image-api';

export const useProfileImageUpload = () => {
    const queryClient = useQueryClient();

    const uploadMutation = useMutation({
        mutationFn: profileImageApi.uploadProfileImage,
        onSuccess: (data: ProfileImageUploadResponse) => {
            alert('프로필 이미지가 성공적으로 업데이트되었습니다.');

            // 프로필 관련 쿼리 캐시 무효화하여 새 데이터 가져오기
            queryClient.invalidateQueries({ queryKey: ['myProfile'] });
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
        onError: (error: any) => {
            console.error('프로필 이미지 업로드 실패:', error);

            const errorMessage =
                error?.response?.data?.error || '프로필 이미지 업로드에 실패했습니다.';
            alert(errorMessage);
        },
    });

    const uploadProfileImage = async (file: File) => {
        // 파일 유효성 검사
        if (!file) {
            alert('파일을 선택해주세요.');
            return;
        }

        // 파일 크기 검사 (20MB)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (file.size > maxSize) {
            alert('파일 크기는 20MB를 초과할 수 없습니다.');
            return;
        }

        // 파일 형식 검사
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP만 지원)');
            return;
        }

        try {
            await uploadMutation.mutateAsync(file);
        } catch (error) {
            // 에러는 mutation의 onError에서 처리됨
        }
    };

    return {
        uploadProfileImage,
        isUploading: uploadMutation.isPending,
        isError: uploadMutation.isError,
        error: uploadMutation.error,
    };
};
