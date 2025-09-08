import { authApi } from '@/apis/api';

/**
 * 로그인 후 온보딩 상태에 따른 리다이렉트 처리
 */
export const handleAuthRedirect = async (maxRetries = 3, baseDelay = 500): Promise<string> => {
    let retryCount = 0;

    const attemptAuth = async (): Promise<string> => {
        try {
            // 쿠키 저장을 위한 지연
            if (retryCount > 0) {
                await new Promise((resolve) => setTimeout(resolve, baseDelay * retryCount));
            }

            const authData = await authApi.me();

            if (!authData.authenticated) {
                throw new Error('Authentication failed');
            }

            // 온보딩 상태에 따른 경로 결정
            if (authData.onboarding?.isOnboarded) {
                return '/'; // 메인 페이지
            } else {
                return '/job-selection'; // 온보딩 페이지
            }
        } catch (error) {
            retryCount++;

            if (retryCount <= maxRetries) {
                console.log(`인증 확인 재시도 ${retryCount}/${maxRetries}`);
                return attemptAuth();
            }

            throw error;
        }
    };

    return attemptAuth();
};

/**
 * 쿠키 저장 상태 확인
 */
export const waitForCookie = async (maxWaitTime = 3000, checkInterval = 200): Promise<boolean> => {
    const startTime = Date.now();

    return new Promise((resolve) => {
        const checkAuth = async () => {
            try {
                const authData = await authApi.me();
                if (authData.authenticated) {
                    resolve(true);
                    return;
                }
            } catch (error) {
                // 에러가 발생해도 계속 체크
            }

            // 최대 대기 시간 초과
            if (Date.now() - startTime >= maxWaitTime) {
                resolve(false);
                return;
            }

            // 다음 체크까지 대기
            setTimeout(checkAuth, checkInterval);
        };

        checkAuth();
    });
};
