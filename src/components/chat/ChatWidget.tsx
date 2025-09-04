'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useChatStore } from '@/stores/chat-store';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { WebSocketMessage } from '@/types/chat';

export const ChatWidget = () => {
    const [userId, setUserId] = useState<number | null>(null);
    const {
        addMessage,
        updateUnreadCount,
        setOnlineUsers,
        setConnectionStatus,
        loadConversations,
        loadConversationsWithUnread,
    } = useChatStore();

    // localStorage에서 user_idx 가져오기
    useEffect(() => {
        const storedUserId = localStorage.getItem('user_idx');
        if (storedUserId) {
            const userId = parseInt(storedUserId, 10);
            setUserId(userId);
        }
    }, []);

    const { sendMessage } = useWebSocket({
        userId: userId || 0,
        onMessage: (message: WebSocketMessage) => {
            addMessage(message);
        },
        onUnreadCountUpdate: (count: number) => {
            updateUnreadCount(count);
        },
        onOnlineUsersUpdate: (userIds: number[]) => {
            setOnlineUsers(userIds);
        },
        onConnectionStatusChange: (isConnected: boolean) => {
            setConnectionStatus(isConnected);
        },
    });

    // WebSocket sendMessage를 스토어에 연결
    useEffect(() => {
        const wrappedSendMessage = async (receiverId: number, content: string) => {
            sendMessage(receiverId, content);
        };
        useChatStore.setState({ sendMessage: wrappedSendMessage });
    }, [sendMessage]);

    useEffect(() => {
        if (userId) {
            loadConversationsWithUnread(userId);
        }
    }, [userId, loadConversationsWithUnread]);

    if (!userId) return null;

    return (
        <>
            <ChatButton userId={userId} />
            {typeof window !== 'undefined' &&
                createPortal(<ChatWindow userId={userId} />, document.body)}
        </>
    );
};
