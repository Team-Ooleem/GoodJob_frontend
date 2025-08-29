import { create } from 'zustand';

// =============example=============
interface UIState {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    toggleSidebar: () => void;
    setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: false,
    theme: 'light',
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setTheme: (theme: 'light' | 'dark') => set({ theme }),
}));
// =============example=============
