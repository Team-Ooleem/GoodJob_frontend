import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/apis/api';

export interface User {
    idx: number; // 우리 DB의 사용자 idx
    id: string; // 구글 사용자 고유 ID
    email: string;
    name: string;
    picture: string;
}

export interface AuthState {
    authenticated: boolean;
    user?: User;
}

export const useAuth = () => {
    const router = useRouter();
    const {
        data: authData,
        isLoading,
        error,
        refetch,
    } = useQuery<AuthState>({
        queryKey: ['auth', 'me'],
        queryFn: authApi.me,
        retry: false,
        refetchOnWindowFocus: false,
    });

    // 인증되지 않은 경우 자동 리다이렉트 처리
    useEffect(() => {
        if (!isLoading && authData && !authData.authenticated) {
            // 현재 페이지가 로그인 페이지가 아닐 때만 처리
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;

                const isAuthPage = currentPath.includes('/login');
                const isHomePage = currentPath === '/';

                if (!isAuthPage && !isHomePage) {
                    router.push('/login');
                }
            }
        }
    }, [authData, isLoading, router]);

    const logout = async () => {
        try {
            await authApi.logout();
            // 쿼리 캐시 무효화
            refetch();
            // 홈페이지로 리다이렉트
            router.push('/');
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    return {
        user: authData?.user,
        isAuthenticated: authData?.authenticated || false,
        isLoading,
        error,
        refetch,
        logout,
    };
};
