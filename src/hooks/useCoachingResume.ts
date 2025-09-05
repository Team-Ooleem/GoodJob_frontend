import { useMutation } from '@tanstack/react-query';
import { CoachingResumeApi } from '@/apis/coaching-resume-api';

export const useCoachingResume = () => {
    const createCoachingCanvas = useMutation({
        mutationFn: (data: { name: string; participantId: number }) =>
            CoachingResumeApi.createCoachingCanvas(data),
    });

    return {
        createCoachingCanvas,
    };
};
