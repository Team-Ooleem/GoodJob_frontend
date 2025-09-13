// src/components/app-sidebar.tsx

import { BookOpen, Calendar, Star } from 'lucide-react';
import Link from 'next/link';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const items = [
    { title: '멘토링 관리', url: '/admin', icon: BookOpen },
    { title: '예약 관리', url: '/admin/reservation', icon: Calendar },
    { title: '리뷰 관리', url: '/admin/review', icon: Star },
];

export function AppSidebar() {
    return (
        <Sidebar className='relative w-50'>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>관리</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
