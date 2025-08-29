'use client';

import { useState } from 'react';
import { useUsers, useUser } from '@/hooks/use-users';

export function ReactQueryTest() {
    const [selectedUserId, setSelectedUserId] = useState<string>('');

    // React Query hooks
    const usersQuery = useUsers();
    const userQuery = useUser(selectedUserId);

    return (
        <div className='p-6 bg-white rounded-lg shadow-md'>
            <h2 className='text-2xl font-bold mb-6 text-gray-800'>React Query 테스트</h2>

            {/* 사용자 목록 */}
            <div className='mb-8 p-4 border border-gray-200 rounded-lg'>
                <h3 className='text-lg font-semibold mb-4 text-blue-600'>사용자 목록</h3>
                {usersQuery.isLoading && <p className='text-blue-500'>로딩 중...</p>}
                {usersQuery.isError && (
                    <p className='text-red-500'>에러: {usersQuery.error?.message}</p>
                )}
                {usersQuery.data && (
                    <div className='space-y-2'>
                        {usersQuery.data.map((user) => (
                            <div
                                key={user.id}
                                className='flex items-center justify-between bg-gray-50 p-3 rounded'
                            >
                                <div>
                                    <p>
                                        <strong>{user.name}</strong> ({user.email})
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedUserId(user.id)}
                                    className='px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600'
                                >
                                    상세보기
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className='mt-4'>
                    <button
                        onClick={() => usersQuery.refetch()}
                        className='px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600'
                    >
                        새로고침
                    </button>
                </div>
            </div>

            {/* 선택된 사용자 상세 정보 */}
            {selectedUserId && (
                <div className='p-4 border border-gray-200 rounded-lg'>
                    <h3 className='text-lg font-semibold mb-4 text-green-600'>사용자 상세 정보</h3>
                    {userQuery.isLoading && <p className='text-blue-500'>로딩 중...</p>}
                    {userQuery.isError && (
                        <p className='text-red-500'>에러: {userQuery.error?.message}</p>
                    )}
                    {userQuery.data && (
                        <div className='bg-gray-50 p-3 rounded'>
                            <p>
                                <strong>ID:</strong> {userQuery.data.id}
                            </p>
                            <p>
                                <strong>이름:</strong> {userQuery.data.name}
                            </p>
                            <p>
                                <strong>이메일:</strong> {userQuery.data.email}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
