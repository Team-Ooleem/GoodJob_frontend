/**
 * @description 서버 컴포넌트는 공유 캐시를 가지면 안되기 때문에 서버 요청일 때는 queryclient 를 새로 생성해야 함
 * @see https://victory-ju.tistory.com/entry/Nextjs-Nextjs-SSR-조림-그런데-이제-Tanstackreact-query를-곁들인
 */
import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
            dehydrate: {
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
    if (isServer) {
        return makeQueryClient();
    } else {
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}
