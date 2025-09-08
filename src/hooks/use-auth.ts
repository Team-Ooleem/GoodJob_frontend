import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    onboarding?: {
        isOnboarded: boolean;
        redirectUrl: string;
    };
}

export const useAuth = () => {
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
        staleTime: 5 * 60 * 1000, // 5분간 캐시
    });

    const logout = async () => {
        try {
            await authApi.logout();
            // 쿼리 캐시 무효화
            refetch();
            // 홈페이지로 리다이렉트
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    return {
        user: authData?.user,
        isAuthenticated: authData?.authenticated || false,
        onboarding: authData?.onboarding,
        isLoading,
        error,
        refetch,
        logout,
    };
};
