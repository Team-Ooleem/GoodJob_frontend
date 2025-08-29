// Mock API functions for testing
export interface User {
    id: string;
    name: string;
    email: string;
}

// Mock users data
const mockUsers: User[] = [
    { id: '1', name: '김철수', email: 'kim@example.com' },
    { id: '2', name: '이영희', email: 'lee@example.com' },
];

export const userApi = {
    // Get all users
    getUsers: async (): Promise<User[]> => {
        return mockUsers;
    },

    // Get user by ID
    getUserById: async (id: string): Promise<User | null> => {
        const user = mockUsers.find((u) => u.id === id);
        return user || null;
    },
};
