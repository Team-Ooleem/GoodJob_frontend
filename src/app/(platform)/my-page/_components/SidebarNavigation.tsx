'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bot, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavigationItem[] = [
    {
        href: '/my-page',
        label: '홈',
        icon: Home,
    },
    {
        href: '/my-page/ai-interview-result',
        label: 'AI 인터뷰',
        icon: Bot,
    },
    {
        href: '/my-page/coaching-resume-result',
        label: '이력서 코칭',
        icon: FileText,
    },
];

export default function SidebarNavigation() {
    const pathname = usePathname();

    return (
        <nav className='space-y-2'>
            {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                    pathname === item.href ||
                    (item.href !== '/my-page' && pathname.startsWith(item.href));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        )}
                    >
                        <Icon className='h-4 w-4' />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
