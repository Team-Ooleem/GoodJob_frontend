import type { Metadata } from 'next';

import { Header, Footer } from '@/components';
import { ChatWidget } from '@/components/chat';

export const metadata: Metadata = {
    title: 'GoodJob',
    description: 'GoodJob',
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className='min-h-screen'>
            <Header />
            {children}
            <Footer />
            <ChatWidget />
        </div>
    );
}
