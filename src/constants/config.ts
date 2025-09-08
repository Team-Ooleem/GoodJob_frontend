/**
 * 환경별 설정을 중앙화하여 관리하는 설정 파일
 */

// 환경 타입 정의
export type Environment = 'development' | 'production';

// 현재 환경 감지
export const getCurrentEnvironment = (): Environment => {
    return (process.env.NODE_ENV as Environment) || 'development';
};

// 환경별 설정 인터페이스
interface EnvironmentConfig {
    BACKEND_ORIGIN: string;
    API_BASE_URL: string;
    AUDIO_API_BASE: string;
    SOCKET_CHAT_URL: string;
    REQUEST_TIMEOUT: number;
}

// 환경별 설정값 정의
const environmentConfigs: Record<Environment, EnvironmentConfig> = {
    development: {
        BACKEND_ORIGIN: process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:3000',
        API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
        AUDIO_API_BASE: process.env.NEXT_PUBLIC_AUDIO_API_BASE || 'http://localhost:8081',
        SOCKET_CHAT_URL:
            process.env.NEXT_PUBLIC_SOCKET_CHAT_URL || 'http://localhost:3000/api/chat',
        REQUEST_TIMEOUT: 60000,
    },
    production: {
        BACKEND_ORIGIN: process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'https://good-job.duckdns.org',
        API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://good-job.duckdns.org/api',
        AUDIO_API_BASE:
            process.env.NEXT_PUBLIC_AUDIO_API_BASE || 'https://ai-api-good-job.duckdns.org',
        SOCKET_CHAT_URL:
            process.env.NEXT_PUBLIC_SOCKET_CHAT_URL || 'https://good-job.duckdns.org/api/chat',
        REQUEST_TIMEOUT: 30000,
    },
};

// 현재 환경의 설정 가져오기
const config = environmentConfigs[getCurrentEnvironment()];

// 설정값들을 개별적으로 export
export const { API_BASE_URL, BACKEND_ORIGIN, AUDIO_API_BASE, SOCKET_CHAT_URL, REQUEST_TIMEOUT } =
    config;
