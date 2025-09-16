import { useMutation, useQuery } from '@tanstack/react-query';
import { getJobCategories, createMentorApplication } from '../_apis/mentor-api';

// 직무 카테고리 조회 훅
export const useJobCategories = () => {
    return useQuery({
        queryKey: ['job-categories'],
        queryFn: getJobCategories,
    });
};

// 멘토 지원 제출 훅
export const useCreateMentorApplication = () => {
    return useMutation({
        mutationFn: createMentorApplication,
        onSuccess: (data) => {
            console.log('멘토 지원 성공:', data.message);
        },
        onError: (error) => {
            console.error('멘토 지원 실패:', error);
        },
    });
};
