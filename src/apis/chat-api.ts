import { api } from './api';
import {
    ChatApiResponse,
    ChatConversation,
    ChatMessage,
    ChatUser,
    ChatStats,
    ChatConversationId,
} from '@/types/chat';

const CHAT_BASE_URL = '/chat';

// 1. 내 채팅방 목록 조회
export const getConversations = async (userId: number): Promise<ChatConversation[]> => {
    const response = await api.get<ChatApiResponse<ChatConversation[]>>(
        `${CHAT_BASE_URL}/conversations/${userId}`,
    );

    if (!response.data.success) {
        throw new Error(response.data.message || '채팅방 목록 조회에 실패했습니다.');
    }

    return response.data.data || [];
};

// 2. 특정 채팅방의 메시지 조회
export const getMessages = async (
    conversationId: number,
    limit: number = 50,
    offset: number = 0,
): Promise<ChatMessage[]> => {
    const response = await api.get<ChatApiResponse<ChatMessage[]>>(
        `${CHAT_BASE_URL}/messages/${conversationId}`,
        {
            params: { limit, offset },
        },
    );

    if (!response.data.success) {
        throw new Error(response.data.message || '메시지 조회에 실패했습니다.');
    }

    return response.data.data || [];
};

// 3. 메시지 전송
export const sendMessage = async (
    senderId: number,
    receiverId: number,
    content: string,
): Promise<{ messageId: number; conversationId: number }> => {
    const response = await api.post<ChatApiResponse>(`${CHAT_BASE_URL}/messages`, {
        sender_id: senderId,
        receiver_id: receiverId,
        content,
    });

    if (!response.data.success) {
        throw new Error(response.data.message || '메시지 전송에 실패했습니다.');
    }

    return {
        messageId: response.data.message_id || 0,
        conversationId: response.data.conversation_id || 0,
    };
};

// 4. 메시지 읽음 처리
export const markMessageAsRead = async (
    conversationId: number,
    userId: number,
    lastMessageId: number,
): Promise<void> => {
    const response = await api.post<ChatApiResponse>(
        `${CHAT_BASE_URL}/messages/${conversationId}/read`,
        {
            user_id: userId,
            last_message_id: lastMessageId,
        },
    );

    if (!response.data.success) {
        throw new Error(response.data.message || '메시지 읽음 처리에 실패했습니다.');
    }
};

// 5. 사용자 검색
export const searchUsers = async (
    q: string,
    userId: number,
    limit: number = 20,
): Promise<ChatUser[]> => {
    try {
        const response = await api.get<ChatApiResponse<ChatUser[]>>(
            `${CHAT_BASE_URL}/search/users`,
            {
                params: {
                    q,
                    user_id: userId,
                    limit,
                },
            },
        );

        if (!response.data.success) {
            throw new Error(response.data.message || '사용자 검색에 실패했습니다.');
        }

        return response.data.data || [];
    } catch (error: any) {
        throw error;
    }
};

// 6. 읽지 않은 메시지가 있는 채팅방 조회
export const getUnreadConversations = async (userId: number): Promise<ChatConversation[]> => {
    const response = await api.get<ChatApiResponse<ChatConversation[]>>(
        `${CHAT_BASE_URL}/unread/${userId}`,
    );

    if (!response.data.success) {
        throw new Error(response.data.message || '읽지 않은 채팅방 조회에 실패했습니다.');
    }

    return response.data.data || [];
};

// 7. 채팅 통계 조회
export const getChatStats = async (userId: number): Promise<ChatStats> => {
    const response = await api.get<ChatApiResponse<ChatStats>>(`${CHAT_BASE_URL}/stats/${userId}`);

    if (!response.data.success) {
        throw new Error(response.data.message || '채팅 통계 조회에 실패했습니다.');
    }

    return (
        response.data.data || {
            total_conversations: 0,
            total_unread_messages: 0,
            active_conversations_24h: 0,
        }
    );
};

// 8. 채팅방 삭제
export const deleteConversation = async (user1Id: number, user2Id: number): Promise<void> => {
    const response = await api.post<ChatApiResponse>(`${CHAT_BASE_URL}/conversations/delete`, {
        user1_id: user1Id,
        user2_id: user2Id,
    });

    if (!response.data.success) {
        throw new Error(response.data.message || '채팅방 삭제에 실패했습니다.');
    }
};

// 9. 채팅방 ID 조회
export const getConversationId = async (
    user1Id: number,
    user2Id: number,
): Promise<number | null> => {
    const response = await api.get<ChatApiResponse<ChatConversationId>>(
        `${CHAT_BASE_URL}/conversation-id/${user1Id}/${user2Id}`,
    );

    if (!response.data.success) {
        throw new Error(response.data.message || '채팅방 ID 조회에 실패했습니다.');
    }

    return response.data.data?.conversation_id || null;
};

// 기존 호환성을 위한 래퍼 함수들
export const getConversationsWithUnread = async (userId: number): Promise<ChatConversation[]> => {
    return getConversations(userId);
};

export const checkConversationExists = async (
    userId: number,
    otherUserId: number,
): Promise<boolean> => {
    try {
        const conversationId = await getConversationId(userId, otherUserId);
        return conversationId !== null;
    } catch {
        return false;
    }
};

export const getConversationUnreadCount = async (
    userId: number,
    otherUserId: number,
): Promise<number> => {
    try {
        const conversationId = await getConversationId(userId, otherUserId);
        if (!conversationId) return 0;

        const conversations = await getUnreadConversations(userId);
        const conversation = conversations.find((c) => c.other_user_id === otherUserId);
        return conversation?.unread_count || 0;
    } catch {
        return 0;
    }
};

export const markConversationAsRead = async (
    userId: number,
    otherUserId: number,
): Promise<void> => {
    try {
        const conversationId = await getConversationId(userId, otherUserId);
        if (!conversationId) return;

        // 마지막 메시지 ID를 가져와서 읽음 처리
        const messages = await getMessages(conversationId, 1, 0);
        if (messages.length > 0) {
            await markMessageAsRead(conversationId, userId, messages[0].message_id);
        }
    } catch (error) {
        console.error('대화 읽음 처리 실패:', error);
    }
};
