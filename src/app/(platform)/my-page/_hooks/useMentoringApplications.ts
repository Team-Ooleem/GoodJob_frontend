import { useQuery } from '@tanstack/react-query';
import { fetchMentoringApplications } from '../_lib/api';

interface UseMentoringApplicationsParams {
    user_idx: number;
    page?: number;
    limit?: number;
}

export const useMentoringApplications = ({
    user_idx,
    page = 1,
    limit = 10,
}: UseMentoringApplicationsParams) => {
    return useQuery({
        queryKey: ['mentoring-applications', user_idx, page, limit],
        queryFn: () => fetchMentoringApplications({ user_idx, page, limit }),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        enabled: !!user_idx, // user_idx가 있을 때만 호출
    });
};
