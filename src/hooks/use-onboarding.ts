import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/apis/(onboarding)/profile-api';
import { Profile } from '@/types/types';

export const useOnboarding = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);

    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    const checkOnboardingStatus = async () => {
        try {
            setIsLoading(true);
            const response = await getProfile();

            if (response.success && response.data.profile) {
                const profile = response.data.profile;
                setUserProfile(profile);

                // 온보딩 완료 여부 확인
                const isComplete = Boolean(profile.onboarding_completed);

                setIsOnboardingComplete(isComplete);

                // 온보딩이 완료되지 않았다면 온보딩 페이지로 리다이렉트
                if (!isComplete) {
                    router.push('/job-selection');
                } else {
                    // 온보딩이 완료되었다면 메인 페이지로 리다이렉트
                    router.push('/user/home');
                }
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // 에러 발생 시 로그인되지 않은 상태로 간주
            setIsOnboardingComplete(false);
        } finally {
            setIsLoading(false);
        }
    };

    const redirectToOnboarding = () => {
        router.push('/job-selection');
    };

    const redirectToMain = () => {
        router.push('/user/home');
    };

    return {
        isLoading,
        isOnboardingComplete,
        userProfile,
        checkOnboardingStatus,
        redirectToOnboarding,
        redirectToMain,
    };
};
