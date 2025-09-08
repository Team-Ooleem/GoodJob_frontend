import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '@/constants/config';

export const apiConfig = {
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    withCredentials: true,
};

// axios 인스턴스 생성
export const api = axios.create(apiConfig);

// 요청 인터셉터 (JWT 토큰 자동 추가)
api.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// 응답 인터셉터 (에러 처리 등)
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
        if (err?.response?.status === 401) {
            // /auth/me API는 로그인 상태 확인용이므로 alert 표시하지 않음
            const isAuthMeRequest = err?.config?.url?.includes('/auth/me');

            if (!isAuthMeRequest) {
                // 이 때 프론트는 직접 httpOnly 쿠키를 지울 수 없으므로
                // /auth/logout 호출해서 서버 측에서 clearCookie('session', ...)로 쿠키를 제거
                try {
                    await api.get('/auth/logout');
                } catch {}

                // 현재 페이지가 로그인 관련 페이지가 아닐 때만 알림 표시
                if (typeof window !== 'undefined') {
                    const currentPath = window.location.pathname;
                    const isAuthPage = currentPath.includes('/login');

                    // 로그인 관련 페이지가 아닐 때만 alert 표시
                    if (!isAuthPage) {
                        alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                        // 이후 /login 페이지로 리다이렉트하여 사용자에게 재로그인을 유도
                        window.location.href = '/login';
                    }
                }
            }
        }
        throw err;
    },
);

// 사용자 인증 관련 API
export const authApi = {
    // 현재 로그인된 사용자 정보 조회
    me: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // 로그아웃
    logout: async () => {
        const response = await api.get('/auth/logout');
        return response.data;
    },
};
