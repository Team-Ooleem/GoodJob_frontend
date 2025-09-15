import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { Footer } from '@/components';
import { AdminHeader } from './components/AdminHeader';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: '멘토링 관리자 페이지 | Goodjob',
    description: '멘토링 관리를 할 수 있는 관리자 페이지입니다.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <AdminHeader />
                <main>{children}</main>
                <Footer />
            </SidebarInset>
        </SidebarProvider>
    );
}
