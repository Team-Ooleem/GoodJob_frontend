import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

export const apiConfig = {
    baseURL: API_BASE_URL,
    timeout: 5000,
};

// axios 인스턴스 생성
export const api = axios.create(apiConfig);

// 요청 인터셉터 (JWT 토큰 자동 추가)
api.interceptors.request.use(
    (config) => {
        // 토큰이 필요 없는 경로들 (공개 API)
        const publicPaths = ['/auth/google', '/auth/login'];

        // 현재 요청 경로가 공개 경로인지 확인
        const isPublicPath = publicPaths.some((path) => config.url?.includes(path));

        // 공개 경로가 아니고 토큰이 있다면 헤더에 추가
        if (!isPublicPath) {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
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
        console.log('🔴 [API] 응답 인터셉터 에러:', err);
        // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
        if (err?.response?.status === 401) {
            // 이 때 프론트는 직접 httpOnly 쿠키를 지울 수 없으므로
            // /auth/logout 호출해서 서버 측에서 clearCookie('session', ...)로 쿠키를 제거
            try {
                await api.post('/auth/logout');
            } catch {}

            // 사용자에게 알림 메시지 표시
            if (typeof window !== 'undefined') {
                alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                // 이후 /login 페이지로 리다이렉트하여 사용자에게 재로그인을 유도
                window.location.href = '/login';
            }
        }
        throw err;
    },
);
