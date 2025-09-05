'use client';

import { Button } from 'antd';
import { useUserStore } from '@/stores/user-store';

export const ChatTestButton = () => {
    const { login, logout, isAuthenticated, user } = useUserStore();

    const handleLogin = () => {
        login({
            id: '1',
            name: '테스트 사용자',
            email: 'test@example.com',
            idx: 1, // 채팅에서 사용할 숫자 ID
        });
    };

    const handleLogout = () => {
        logout();
    };

    if (isAuthenticated) {
        return (
            <div className='fixed top-4 right-4 z-50'>
                <div className='bg-white p-4 rounded-lg shadow-lg'>
                    <p className='text-sm mb-2'>로그인됨: {user?.name}</p>
                    <Button onClick={handleLogout} size='small'>
                        로그아웃
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className='fixed top-4 right-4 z-50'>
            <Button onClick={handleLogin} type='primary'>
                테스트 로그인
            </Button>
        </div>
    );
};
