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
            console.log('🔍 API 호출 파라미터:', {
                ...params,
                cursor: pageParam as string,
            });

            const response = await getMentoringProducts({
                ...params,
                cursor: pageParam as string,
            });

            console.log('📦 API 응답 데이터:', response);
            return response;
        },
        getNextPageParam: (lastPage) => {
            console.log('📄 다음 페이지 파라미터:', {
                has_more: lastPage?.has_more,
                next_cursor: lastPage?.next_cursor,
            });
            return lastPage?.has_more ? lastPage?.next_cursor : undefined;
        },
        initialPageParam: '0', // 첫 요청은 cursor 0부터 시작
        enabled,
    });
};
