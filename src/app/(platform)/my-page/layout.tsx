import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ProfileSection } from '@/components';
import { SidebarNavigation } from './_components';
import { API_BASE_URL } from '@/constants/config';

// 서버 사이드에서 쿠키를 포함한 API 호출을 위한 헬퍼
async function getAuthDataWithCookies() {
    const cookieStore = cookies();
    const cookieString = cookieStore.toString();

    // 기존 authApi.me()를 사용하되, 쿠키를 수동으로 전달
    // 이렇게 하면 기존 API 구조를 그대로 유지할 수 있습니다
    try {
        // 서버 사이드에서는 쿠키를 직접 전달해야 합니다
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
        console.error('❌ 서버 사이드 API 호출 에러:', error);
        throw error;
    }
}

// 동적으로 메타데이터 생성
export async function generateMetadata(): Promise<Metadata> {
    try {
        const authData = await getAuthDataWithCookies();
        const userName = authData?.user?.name;

        return {
            title: userName ? `${userName}님의 마이페이지 | GoodJob` : '마이페이지 | GoodJob',
            description: userName
                ? `${userName}님의 AI 모의면접 플랫폼 GoodJob 마이페이지에서 나의 면접 기록과 이력서 코칭 결과를 확인하세요.`
                : 'AI 모의면접 플랫폼 GoodJob의 마이페이지에서 나의 면접 기록과 이력서 코칭 결과를 확인하세요.',
            keywords: [
                '마이페이지',
                'AI 면접',
                '모의면접',
                '이력서 코칭',
                'GoodJob',
                userName,
            ].filter(Boolean),
        };
    } catch (error) {
        // 인증 실패 시 기본 메타데이터 반환
        return {
            title: '마이페이지 | GoodJob',
            description:
                'AI 모의면접 플랫폼 GoodJob의 마이페이지에서 나의 면접 기록과 이력서 코칭 결과를 확인하세요.',
            keywords: ['마이페이지', 'AI 면접', '모의면접', '이력서 코칭', 'GoodJob'],
        };
    }
}

export default async function MyPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className='min-h-screen bg-background'>
            {/* 헤더 */}
            <div className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
                <div className='mx-auto max-w-[1300px] w-full px-4 md:px-6 h-[60px] flex items-center'>
                    <h1 className='text-xl font-semibold'>마이페이지</h1>
                </div>
            </div>

            <div className='mx-auto max-w-[1300px] w-full px-4 md:px-6 py-6'>
                <div className='flex gap-6'>
                    {/* 사이드바 */}
                    <div className='w-80 flex-shrink-0 space-y-6'>
                        {/* 프로필 섹션 */}
                        <ProfileSection />

                        {/* 네비게이션 */}
                        <div className='bg-card rounded-lg border p-4'>
                            <h3 className='font-semibold mb-4'>네비게이션</h3>
                            <SidebarNavigation />
                        </div>
                    </div>

                    {/* 메인 콘텐츠 영역 */}
                    <div className='flex-1 min-w-0'>{children}</div>
                </div>
            </div>
        </div>
    );
}
