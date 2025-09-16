import { SocialContent } from './_components';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '피드 | Good Job',
    description: '피드',
};

export default function SocialPage() {
    return <SocialContent />;
}
