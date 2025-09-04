import { UserProfileDetail } from './_components';
import { Metadata } from 'next';

interface ProfilePageProps {
    params: {
        userId: string;
    };
}

export const metadata: Metadata = {
    title: '프로필 | Good Job',
    description: '사용자 프로필 상세 페이지',
};

export default function ProfilePage({ params }: ProfilePageProps) {
    const { userId } = params;

    return <UserProfileDetail userId={userId} />;
}
