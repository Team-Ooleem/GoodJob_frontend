'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useChatStore } from '@/stores/chat-store';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';
import { WebSocketMessage } from '@/types/chat';
import { useAuth } from '@/hooks';

export const ChatWidget = () => {
    const { user, isAuthenticated } = useAuth();
    const userId = user?.idx || null;
    const {
        addMessage,
        updateUnreadCount,
        setOnlineUsers,
        setConnectionStatus,
        loadConversations,
        loadConversationsWithUnread,
    } = useChatStore();

    // Zustand 함수들을 useCallback으로 메모이제이션
    const handleMessage = useCallback(
        (message: WebSocketMessage) => {
            if (userId) {
                addMessage(message, userId);
            }
        },
        [addMessage, userId],
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

    if (!isAuthenticated || !userId) return null;

    return (
        <>
            <ChatButton userId={userId} />
            {typeof window !== 'undefined' &&
                createPortal(<ChatWindow userId={userId} />, document.body)}
        </>
    );
};
