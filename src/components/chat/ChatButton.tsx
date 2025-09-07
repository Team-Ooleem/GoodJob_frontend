'use client';

import { MessageOutlined } from '@ant-design/icons';
import { useChatStore } from '@/stores/chat-store';
import { useEffect } from 'react';

interface ChatButtonProps {
    userId: number;
}

export const ChatButton = ({ userId }: ChatButtonProps) => {
    const { isOpen, unreadCount, toggleChat, loadConversationsWithUnread } = useChatStore();

    useEffect(() => {
        if (userId) {
            loadConversationsWithUnread(userId);
        }
    }, [userId, loadConversationsWithUnread]);

    return (
        <div className='fixed bottom-6 right-6 z-50'>
            <div className='relative'>
                {unreadCount > 0 && (
                    <div className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center z-10'>
                        {unreadCount}
                    </div>
                )}
                <button
                    onClick={toggleChat}
                    className={`w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                >
                    <MessageOutlined className='text-xl' />
                </button>
            </div>
        </div>
    );
};
