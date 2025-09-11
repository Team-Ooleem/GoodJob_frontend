import type { Metadata } from 'next';
import MentoringMainContent from './_components/MentoringMainContent';

export const metadata: Metadata = {
    title: '멘토링 - GoodJob',
    description: '가장 쉽게 지식을 공유하는 방법, 멘토링으로 시작하세요.',
};

export default function MentoringPage() {
    return <MentoringMainContent />;
}
