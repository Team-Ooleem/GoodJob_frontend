import { useInfiniteQuery } from '@tanstack/react-query';
import {
    getMentoringProducts,
    MentoringProductsParams,
    MentoringProductsResponse,
} from '../_apis/mentoring-product-api';

interface UseMentoringProductsOptions {
    params?: Omit<MentoringProductsParams, 'cursor'>;
    enabled?: boolean;
}

export const useMentoringProducts = ({
    params = {},
    enabled = true,
}: UseMentoringProductsOptions = {}) => {
    return useInfiniteQuery<MentoringProductsResponse>({
        queryKey: ['mentoring-products', params],
        queryFn: async ({ pageParam }) => {
            const response = await getMentoringProducts({
                ...params,
                cursor: pageParam as string,
            });

            return response;
        },
        getNextPageParam: (lastPage) => {
            return lastPage?.has_more ? lastPage?.next_cursor : undefined;
        },
        initialPageParam: '0', // 첫 요청은 cursor 0부터 시작
        enabled,
    });
};
