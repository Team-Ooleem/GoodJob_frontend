'use client';

import { ChatWidget } from '@/components/chat';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className='min-h-screen'>
            {children}
            <ChatWidget />
        </div>
    );
}
