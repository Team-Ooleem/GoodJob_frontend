'use client';

import { useState, useEffect } from 'react';
import { MessageOutlined, SearchOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { useChatStore } from '@/stores/chat-store';
import { ChatConversation, ChatUser } from '@/types/chat';
import { ChatConversationList } from './ChatConversationList';
import { ChatMessageList } from './ChatMessageList';
import { ChatUserSearch } from './ChatUserSearch';

interface ChatWindowProps {
    userId: number;
}

export const ChatWindow = ({ userId }: ChatWindowProps) => {
    const {
        isOpen,
        currentConversation,
        conversations,
        unreadCount,
        isConnected,
        closeChat,
        setCurrentConversation,
        setCurrentUserInfo,
        loadConversationsWithUnread,
    } = useChatStore();

    const [activeTab, setActiveTab] = useState('conversations');

    useEffect(() => {
        if (isOpen && userId) {
            loadConversationsWithUnread(userId);
        }
    }, [isOpen, userId, loadConversationsWithUnread]);

    // currentConversation이 설정되면 메시지 탭으로 자동 이동
    useEffect(() => {
        if (currentConversation) {
            setActiveTab('messages');
        }
    }, [currentConversation]);

    const handleConversationSelect = async (otherUserId: number, userInfo?: ChatUser) => {
        // 대화 상대방 정보 저장
        if (userInfo) {
            setCurrentUserInfo(userInfo);
        }

        setCurrentConversation(otherUserId);
        setActiveTab('messages');

        // 대화 선택 시 대화목록 갱신
        await loadConversationsWithUnread(userId);
    };

    const handleBackToConversations = async () => {
        setCurrentConversation(null);
        setActiveTab('conversations');

        // 대화목록 탭으로 돌아갈 때 갱신
        await loadConversationsWithUnread(userId);
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed bottom-6 right-20 z-40 w-96 h-[700px] transition-all duration-300 ease-in-out transform ${
                isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
        >
            <div className='h-full bg-white rounded-lg shadow-2xl border-0 overflow-hidden flex flex-col'>
                {/* 커스텀 헤더 */}
                <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0'>
                    <div className='flex items-center gap-2'>
                        <MessageOutlined className='text-lg' />
                        <span className='font-medium'>채팅</span>
                        {unreadCount > 0 && (
                            <span className='bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center'>
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeChat}
                        className='p-1 hover:bg-gray-100 rounded transition-colors'
                    >
                        <CloseOutlined className='text-gray-500' />
                    </button>
                </div>

                {/* 탭 네비게이션 */}
                <div className='flex border-b border-gray-200 bg-white flex-shrink-0'>
                    <button
                        onClick={async () => {
                            setActiveTab('conversations');
                            await loadConversationsWithUnread(userId);
                        }}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'conversations'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        대화목록
                    </button>
                    <button
                        onClick={async () => {
                            setActiveTab('search');
                            await loadConversationsWithUnread(userId);
                        }}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'search'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        사용자검색
                    </button>
                    {currentConversation && (
                        <button
                            onClick={async () => {
                                setActiveTab('messages');
                                await loadConversationsWithUnread(userId);
                            }}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                                activeTab === 'messages'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <UserOutlined />
                            메시지
                        </button>
                    )}
                </div>

                {/* 탭 컨텐츠 */}
                <div className='flex-1 overflow-hidden'>
                    {activeTab === 'conversations' && (
                        <ChatConversationList
                            conversations={conversations}
                            onConversationSelect={handleConversationSelect}
                        />
                    )}
                    {activeTab === 'search' && (
                        <ChatUserSearch userId={userId} onUserSelect={handleConversationSelect} />
                    )}
                    {activeTab === 'messages' && currentConversation && (
                        <ChatMessageList
                            userId={userId}
                            otherUserId={currentConversation}
                            isConnected={isConnected}
                            onBack={handleBackToConversations}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
