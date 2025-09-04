'use client';

import { useState } from 'react';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchUsers } from '@/apis/chat-api';
import { ChatUser } from '@/types/chat';
import { useChatStore } from '@/stores/chat-store';

interface ChatUserSearchProps {
    userId: number;
    onUserSelect: (otherUserId: number, userInfo?: ChatUser) => void;
}

export const ChatUserSearch = ({ userId, onUserSelect }: ChatUserSearchProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [shouldSearch, setShouldSearch] = useState(false);
    const queryClient = useQueryClient();
    const { loadConversationsWithUnread } = useChatStore();

    // 사용자 검색
    const {
        data: searchResults = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['searchUsers', searchTerm, userId],
        queryFn: async () => {
            const result = await searchUsers(searchTerm, userId);
            return result;
        },
        enabled: shouldSearch && searchTerm.trim().length >= 1,
    });

    const handleUserSelect = async (user: ChatUser) => {
        onUserSelect(user.user_id, user);
        setSearchTerm('');

        // 새 대화 시작 시 대화목록 갱신
        await loadConversationsWithUnread(userId);
    };

    return (
        <div className='h-full flex flex-col'>
            <div className='p-4 border-b border-gray-100 flex-shrink-0'>
                <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <SearchOutlined className='text-gray-400' />
                    </div>
                    <input
                        type='text'
                        placeholder='사용자 이름으로 검색...'
                        value={searchTerm}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchTerm(value);
                            // 입력할 때마다 검색 활성화
                            if (value.trim().length >= 1) {
                                setShouldSearch(true);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                // 엔터를 눌렀을 때 검색어가 1글자 이상이면 강제로 검색 실행
                                if (searchTerm.trim().length >= 1) {
                                    setShouldSearch(true);
                                    refetch();
                                }
                            }
                        }}
                        className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                    {searchTerm && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setShouldSearch(false);
                            }}
                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className='flex-1 overflow-y-auto'>
                {isLoading ? (
                    <div className='flex items-center justify-center h-32'>
                        <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
                    </div>
                ) : error ? (
                    <div className='flex items-center justify-center h-32'>
                        <div className='text-center text-gray-500'>
                            <div className='text-4xl mb-2'>⚠️</div>
                            <div>검색 중 오류가 발생했습니다</div>
                        </div>
                    </div>
                ) : searchResults.length === 0 && searchTerm.length >= 1 ? (
                    <div className='flex items-center justify-center h-32'>
                        <div className='text-center text-gray-500'>
                            <div className='text-4xl mb-2'>🔍</div>
                            <div>검색 결과가 없습니다</div>
                        </div>
                    </div>
                ) : searchResults.length === 0 && searchTerm.length < 1 ? (
                    <div className='flex items-center justify-center h-32'>
                        <div className='text-center text-gray-500'>
                            <div className='text-4xl mb-2'>👤</div>
                            <div>사용자 이름을 입력해주세요</div>
                        </div>
                    </div>
                ) : (
                    <div className='space-y-0'>
                        {searchResults.map((user) => (
                            <div
                                key={user.user_id}
                                className='cursor-pointer hover:bg-gray-50 px-4 py-3 border-b border-gray-100 transition-colors'
                                onClick={() => handleUserSelect(user)}
                            >
                                <div className='flex items-center gap-3'>
                                    <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0'>
                                        {user.profile_img ? (
                                            <img
                                                src={user.profile_img}
                                                alt={user.name}
                                                className='w-full h-full object-cover'
                                            />
                                        ) : (
                                            <UserOutlined className='text-gray-400' />
                                        )}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <h3 className='font-semibold text-gray-900 text-base truncate'>
                                            {user.name}
                                        </h3>
                                        <p className='text-sm text-gray-600 truncate'>
                                            {user.short_bio || '소개가 없습니다'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
