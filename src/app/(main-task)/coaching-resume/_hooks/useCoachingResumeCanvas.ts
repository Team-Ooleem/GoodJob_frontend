import { useQuery } from '@tanstack/react-query';
import { fetchCoachingResumeCanvas } from '../_lib/api';

export function useCoachingResumeCanvas(canvasId: string) {
    return useQuery({
        queryKey: ['coaching-resume-canvas', canvasId],
        queryFn: () => fetchCoachingResumeCanvas(canvasId),
        enabled: !!canvasId,
        retry: false,
    });
}