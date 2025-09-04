import { create } from 'zustand';

interface User {
    id: string;
    name: string;
    email: string;
    idx?: number; // 채팅에서 사용할 숫자 ID
}

interface UserState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User) => void;
    logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isAuthenticated: false,
    login: (user: User) => set({ user, isAuthenticated: true }),
    logout: () => set({ user: null, isAuthenticated: false }),
}));
