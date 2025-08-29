import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'GoodJob | 비즈니스',
    description: '비즈니스 페이지',
};

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
}
