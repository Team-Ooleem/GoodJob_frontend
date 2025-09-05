import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketResponse, WebSocketMessage } from '@/types/chat';

interface UseWebSocketProps {
    userId: number | null;
    onMessage: (message: WebSocketMessage) => void;
    onUnreadCountUpdate: (count: number) => void;
    onOnlineUsersUpdate: (userIds: number[]) => void;
    onConnectionStatusChange: (isConnected: boolean) => void;
}

export const useWebSocket = ({
    userId,
    onMessage,
    onUnreadCountUpdate,
    onOnlineUsersUpdate,
    onConnectionStatusChange,
}: UseWebSocketProps) => {
    const socketRef = useRef<Socket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        if (!userId) return;

        try {
            const serverUrl = 'http://localhost:4000/api/chat';

            const socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                autoConnect: true,
                forceNew: false, // 기존 연결 재사용
                reconnection: true,
                reconnectionAttempts: 3, // 재연결 시도 횟수 제한
                reconnectionDelay: 2000, // 재연결 지연 시간 증가
                reconnectionDelayMax: 10000, // 최대 재연결 지연 시간
                auth: { userId }, // 사용자 ID 전달
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                onConnectionStatusChange(true);
                reconnectAttempts.current = 0;

                // 연결 시 사용자 등록
                if (userId) {
                    socket.emit('register_user', { userId });
                }
            });

            // 메시지 수신 (다른 사용자로부터)
            socket.on('receive_message', (messageData: WebSocketMessage) => {
                onMessage(messageData);
            });

            // 메시지 전송 응답 (발신자에게만)
            socket.on('send_message_response', (response: any) => {
                if (response.success && response.messageData) {
                    // 전송된 메시지를 로컬에 추가 (중복 체크는 addMessage에서 처리)
                    onMessage(response.messageData);
                }
            });

            // 읽지 않은 메시지 수 업데이트
            socket.on('unread_count_update', (data: { unreadCount: number }) => {
                onUnreadCountUpdate(data.unreadCount);
            });

            socket.on('unread_count', (data: { unreadCount: number }) => {
                onUnreadCountUpdate(data.unreadCount);
            });

            // 온라인 사용자 목록 업데이트
            socket.on('online_users', (data: { userIds: number[] }) => {
                onOnlineUsersUpdate(data.userIds);
            });

            socket.on('disconnect', (reason) => {
                onConnectionStatusChange(false);

                // 서버에서 의도적으로 연결을 끊은 경우가 아닌 경우에만 재연결 시도
                if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
                    if (reconnectAttempts.current < maxReconnectAttempts) {
                        reconnectAttempts.current++;
                        const delay = Math.min(
                            2000 * Math.pow(2, reconnectAttempts.current),
                            10000,
                        );

                        reconnectTimeoutRef.current = setTimeout(() => {
                            connect();
                        }, delay);
                    }
                }
            });

            socket.on('connect_error', (error) => {
                onConnectionStatusChange(false);
            });
        } catch (error) {
            onConnectionStatusChange(false);
        }
    }, [userId, onMessage, onUnreadCountUpdate, onOnlineUsersUpdate, onConnectionStatusChange]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.removeAllListeners(); // 모든 이벤트 리스너 제거
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        reconnectAttempts.current = 0; // 재연결 시도 횟수 초기화
    }, []);

    const sendMessage = useCallback(
        (receiverId: number, content: string) => {
            if (socketRef.current?.connected && userId) {
                const messageData = {
                    senderId: userId,
                    receiverId,
                    content,
                };

                socketRef.current.emit('send_message', messageData);
            }
        },
        [userId],
    );

    const markMessageAsRead = useCallback((messageId: number) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('mark_message_read', { messageId });
        }
    }, []);

    const markConversationAsRead = useCallback((otherUserId: number) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('mark_conversation_read', { otherUserId });
        }
    }, []);

    const getConversationUnreadCount = useCallback((otherUserId: number) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('get_conversation_unread_count', { otherUserId });
        }
    }, []);

    useEffect(() => {
        if (userId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [userId, connect, disconnect]);

    // 웹소켓 연결 후 사용자 등록
    useEffect(() => {
        if (socketRef.current?.connected && userId) {
            // 서버에 사용자 ID 등록
            socketRef.current.emit('register_user', { userId });
        }
    }, [userId]);

    return {
        sendMessage,
        markMessageAsRead,
        markConversationAsRead,
        getConversationUnreadCount,
        isConnected: socketRef.current?.connected || false,
    };
};
