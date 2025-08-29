'use client';

import { useUserStore } from '@/stores/user-store';
import { useUIStore } from '@/stores/ui-store';

export function ZustandTest() {
    const { user, isAuthenticated, login, logout } = useUserStore();
    const { sidebarOpen, theme, toggleSidebar, setTheme } = useUIStore();

    const handleLogin = () => {
        login({
            id: '1',
            name: '테스트 사용자',
            email: 'test@example.com',
        });
    };

    return (
        <div className='p-6 bg-white rounded-lg shadow-md'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>Zustand Store 테스트</h2>

            {/* User Store 테스트 */}
            <div className='mb-8 p-4 border border-gray-200 rounded-lg'>
                <h3 className='text-lg font-semibold mb-4 text-blue-600'>사용자 상태</h3>
                <div className='space-y-2 mb-4'>
                    <p>
                        <strong>인증 상태:</strong>{' '}
                        {isAuthenticated ? '✅ 로그인됨' : '❌ 로그아웃됨'}
                    </p>
                    {user && (
                        <div className='bg-gray-50 p-3 rounded'>
                            <p>
                                <strong>ID:</strong> {user.id}
                            </p>
                            <p>
                                <strong>이름:</strong> {user.name}
                            </p>
                            <p>
                                <strong>이메일:</strong> {user.email}
                            </p>
                        </div>
                    )}
                </div>
                <div className='space-x-2'>
                    <button
                        onClick={handleLogin}
                        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    >
                        로그인
                    </button>
                    <button
                        onClick={logout}
                        className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            {/* UI Store 테스트 */}
            <div className='mb-8 p-4 border border-gray-200 rounded-lg'>
                <h3 className='text-lg font-semibold mb-4 text-green-600'>UI 상태</h3>
                <div className='space-y-2 mb-4'>
                    <p>
                        <strong>사이드바:</strong> {sidebarOpen ? '열림' : '닫힘'}
                    </p>
                    <p>
                        <strong>테마:</strong> {theme}
                    </p>
                </div>
                <div className='space-x-2'>
                    <button
                        onClick={toggleSidebar}
                        className='px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600'
                    >
                        사이드바 토글
                    </button>
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className='px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600'
                    >
                        테마 변경
                    </button>
                </div>
            </div>
        </div>
    );
}
