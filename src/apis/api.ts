import axios from 'axios';

export const API_BASE_URL =
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` || 'http://localhost:4000/api';

export const apiConfig = {
    baseURL: API_BASE_URL,
    timeout: 5000,
};

// axios 인스턴스 생성
export const api = axios.create(apiConfig);

// 요청 인터셉터 (필요시 토큰 추가 등)
api.interceptors.request.use(
    (config) => {
        // 토큰이 있다면 헤더에 추가
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// 응답 인터셉터 (에러 처리 등)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 401 에러 시 토큰 제거
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    },
);
