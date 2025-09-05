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
                console.log('🔗 [WEBSOCKET] 연결 성공:', {
                    socketId: socket.id,
                    userId: userId,
                    userIdType: typeof userId,
                });

                onConnectionStatusChange(true);
                reconnectAttempts.current = 0;

                // 연결 시 사용자 등록
                if (userId) {
                    console.log('📝 [WEBSOCKET] register_user 이벤트 전송:', {
                        userId,
                        type: typeof userId,
                    });
                    socket.emit('register_user', userId); // 숫자 직접 전송
                } else {
                    console.log('❌ [WEBSOCKET] userId가 없어서 사용자 등록 실패');
                }
            });

            // 메시지 수신 (다른 사용자로부터)
            socket.on('receive_message', (messageData: WebSocketMessage) => {
                console.log('📨 [WEBSOCKET] receive_message 수신:', {
                    messageData,
                    timestamp: new Date().toISOString(),
                });
                onMessage(messageData);
                console.log('✅ [WEBSOCKET] onMessage 호출 완료');
            });

            // 메시지 전송 응답 (발신자에게만) - 발신자는 이미 로컬에 추가했으므로 무시
            socket.on('send_message_response', (response: any) => {
                // 발신자 본인의 메시지는 이미 Store에서 추가했으므로 여기서는 처리하지 않음
                console.log('Message sent successfully:', response);
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
    }, [userId]); // 콜백 함수들은 의존성에서 제거

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
            console.log('🌐 [WEBSOCKET] sendMessage 호출:', {
                receiverId,
                content,
                userId,
                isConnected: socketRef.current?.connected,
                timestamp: new Date().toISOString(),
            });

            if (socketRef.current?.connected && userId) {
                const messageData = {
                    senderId: userId,
                    receiverId,
                    content,
                };

                console.log('📡 [WEBSOCKET] emit send_message:', messageData);
                socketRef.current.emit('send_message', messageData);
                console.log('✅ [WEBSOCKET] emit send_message 완료');
            } else {
                console.log('⚠️ [WEBSOCKET] 전송 불가 - 연결 안됨 또는 userId 없음');
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
    }, [userId]); // connect, disconnect 의존성 제거

    return {
        sendMessage,
        markMessageAsRead,
        markConversationAsRead,
        getConversationUnreadCount,
        isConnected: socketRef.current?.connected || false,
    };
};
