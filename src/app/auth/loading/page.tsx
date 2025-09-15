import { Metadata } from 'next';
import AuthLoadingContent from './_components/AuthLoadingContent';

export const metadata: Metadata = {
    title: '로그인 처리 중 | GoodJob',
    description: '사용자 인증을 처리하고 있습니다. 잠시만 기다려주세요.',
    robots: {
        index: false,
        follow: false,
    },
};

export default function AuthLoadingPage() {
    return <AuthLoadingContent />;
}
