import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { Footer } from '@/components';
import { AdminHeader } from './components/AdminHeader';

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
