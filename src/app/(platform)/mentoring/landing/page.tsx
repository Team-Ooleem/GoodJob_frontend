import type { Metadata } from 'next';
import MentoringLandingContent from './components/MentoringLandingContent';

export const metadata: Metadata = {
    title: '멘토링 - GoodJob',
    description: '막막한 취업 준비, 이제 끝내세요',
};

export default function MentoringPage() {
    return <MentoringLandingContent />;
}
