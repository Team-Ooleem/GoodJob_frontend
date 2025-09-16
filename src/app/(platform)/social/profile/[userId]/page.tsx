import { Suspense } from 'react';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { UserProfileLayout } from '../_components';
import { API_BASE_URL } from '@/constants/config';

interface UserProfilePageProps {
    params: {
        userId: string;
    };
}

// 서버 사이드에서 쿠키를 포함한 API 호출을 위한 헬퍼
async function getUserProfileWithCookies(userId: number) {
    const cookieStore = cookies();
    const cookieString = cookieStore.toString();

    try {
        const response = await fetch(`${API_BASE_URL}/social/profile/${userId}`, {
            headers: {
                Cookie: cookieString,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ 서버 사이드 프로필 API 호출 에러:', error);
        throw error;
    }
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
    const { userId } = params;

    try {
        const userProfile = await getUserProfileWithCookies(parseInt(userId));

        return {
            title: `${userProfile.name}님 프로필 페이지 | Good Job`,
            description: userProfile.bio || `${userProfile.name}님의 프로필을 확인해보세요.`,
            keywords: ['프로필', '사용자', 'Good Job', userProfile.name, userProfile.bio].filter(
                Boolean,
            ),
        };
    } catch (error) {
        return {
            title: '프로필 페이지 | Good Job',
            description: '사용자 프로필을 확인해보세요.',
            keywords: ['프로필', '사용자', 'Good Job'],
        };
    }
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
    const { userId } = params;

    return (
        <div className='min-h-screen bg-background'>
            <div className='container mx-auto'>
                <Suspense
                    fallback={
                        <div className='flex justify-center items-center h-64'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                        </div>
                    }
                >
                    <UserProfileLayout userId={parseInt(userId)} />
                </Suspense>
            </div>
        </div>
    );
}
