import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/apis/user-api';

// =============example=============
// Query keys
export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};

// Get all users
export const useUsers = () => {
    return useQuery({
        queryKey: userKeys.lists(),
        queryFn: userApi.getUsers,
    });
};

// Get user by ID
export const useUser = (id: string) => {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => userApi.getUserById(id),
        enabled: !!id,
    });
};
// =============example=============
