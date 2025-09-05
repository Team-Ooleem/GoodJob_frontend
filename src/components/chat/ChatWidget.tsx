'use client';

import { useEffect, useState, useCallback } from 'react';
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

    // Zustand 함수들을 useCallback으로 메모이제이션
    const handleMessage = useCallback(
        (message: WebSocketMessage) => {
            addMessage(message);
        },
        [addMessage],
    );

    const handleUnreadCountUpdate = useCallback(
        (count: number) => {
            updateUnreadCount(count);
        },
        [updateUnreadCount],
    );

    const handleOnlineUsersUpdate = useCallback(
        (userIds: number[]) => {
            setOnlineUsers(userIds);
        },
        [setOnlineUsers],
    );

    const handleConnectionStatusChange = useCallback(
        (isConnected: boolean) => {
            setConnectionStatus(isConnected);
        },
        [setConnectionStatus],
    );

    const { sendMessage: sendWebSocketMessage } = useWebSocket({
        userId: userId || 0,
        onMessage: handleMessage,
        onUnreadCountUpdate: handleUnreadCountUpdate,
        onOnlineUsersUpdate: handleOnlineUsersUpdate,
        onConnectionStatusChange: handleConnectionStatusChange,
    });

    // WebSocket sendMessage를 스토어에 전달 (store의 sendMessage와 구분)
    useEffect(() => {
        useChatStore.setState({
            webSocketSendMessage: sendWebSocketMessage,
        });
    }, [sendWebSocketMessage]);

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
