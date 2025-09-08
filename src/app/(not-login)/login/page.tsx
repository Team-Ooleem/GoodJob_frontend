// src/app/(not-login)/login/page.tsx

'use client'; // 버튼에 onClick 이벤트 쓰려면 꼭 필요!

import { BACKEND_ORIGIN } from '@/constants/config';

export default function LoginPage() {
    const handleGoogleLogin = () => {
        // 백엔드 Nest API 서버로 이동 → 거기서 구글 로그인 리다이렉트
        // window.location.href: 페이지 전체를 새로 로드 (새로운 요청)
        window.location.href = `${BACKEND_ORIGIN}/api/auth/google`; // ← 백엔드 URL
    };

    return (
        <div>
            <h1>소셜 계정으로 간편 로그인</h1>
            <button
                onClick={handleGoogleLogin}
                style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    backgroundColor: '#4285F4',
                    color: 'white',
                    fontWeight: 'bold',
                }}
            >
                Google 로그인
            </button>
        </div>
    );
}
