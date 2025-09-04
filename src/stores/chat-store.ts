import { create } from 'zustand';
import { ChatState, ChatConversation, ChatMessage, ChatUser, WebSocketMessage } from '@/types/chat';
import {
    getConversations,
    getConversationsWithUnread,
    getMessages,
    searchUsers,
    checkConversationExists,
    markConversationAsRead,
    getConversationId,
    sendMessage as sendMessageApi,
} from '@/apis/chat-api';

interface ChatStore extends ChatState {
    // Actions
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    setCurrentConversation: (userId: number | null) => void;
    setCurrentUserInfo: (userInfo: ChatUser | null) => void;

    // Conversations
    loadConversations: (userId: number) => Promise<void>;
    loadConversationsWithUnread: (userId: number) => Promise<void>;
    addConversation: (conversation: ChatConversation) => void;
    updateConversation: (otherUserId: number, updates: Partial<ChatConversation>) => void;

    // Messages
    loadMessages: (conversationId: number) => Promise<void>;
    loadMessagesByUsers: (userId: number, otherUserId: number) => Promise<void>;
    addMessage: (message: WebSocketMessage) => void;
    markConversationAsRead: (userId: number, otherUserId: number) => Promise<void>;
    sendMessage: (receiverId: number, content: string) => Promise<void>;

    // Users
    searchUsers: (name: string, excludeUserId: number) => Promise<ChatUser[]>;

    // Unread count
    updateUnreadCount: (count: number) => void;

    // Online users
    setOnlineUsers: (userIds: number[]) => void;

    // Connection
    setConnectionStatus: (isConnected: boolean) => void;

    // Reset
    reset: () => void;
}

const initialState: ChatState = {
    isOpen: false,
    currentConversation: null,
    currentUserInfo: null,
    conversations: [],
    messages: {},
    unreadCount: 0,
    onlineUsers: [],
    isConnected: false,
};

export const useChatStore = create<ChatStore>((set, get) => ({
    ...initialState,

    // Chat UI
    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),
    setCurrentConversation: (userId) => set({ currentConversation: userId }),
    setCurrentUserInfo: (userInfo) => set({ currentUserInfo: userInfo }),

    // Conversations
    loadConversations: async (userId) => {
        try {
            const conversations = await getConversations(userId);
            set({ conversations });
        } catch (error) {
            set({ conversations: [] });
        }
    },

    loadConversationsWithUnread: async (userId) => {
        try {
            const conversations = await getConversationsWithUnread(userId);
            set({ conversations });
        } catch (error) {
            set({ conversations: [] });
        }
    },

    addConversation: (conversation) => {
        set((state) => ({
            conversations: [
                conversation,
                ...state.conversations.filter(
                    (c) => c.other_user_id !== conversation.other_user_id,
                ),
            ],
        }));
    },

    updateConversation: (otherUserId, updates) => {
        set((state) => ({
            conversations: state.conversations.map((conv) =>
                conv.other_user_id === otherUserId ? { ...conv, ...updates } : conv,
            ),
        }));
    },

    // Messages
    loadMessages: async (conversationId) => {
        try {
            const messages = await getMessages(conversationId);
            set((state) => ({
                messages: {
                    ...state.messages,
                    [conversationId.toString()]: messages,
                },
            }));
        } catch (error) {
            // 메시지 로드 실패 시 무시
        }
    },

    loadMessagesByUsers: async (userId, otherUserId) => {
        try {
            const conversationId = await getConversationId(userId, otherUserId);
            if (conversationId) {
                await get().loadMessages(conversationId);
            }
        } catch (error) {
            // 메시지 로드 실패 시 무시
        }
    },

    addMessage: (message) => {
        // conversationId를 찾기 위해 현재 대화 중인 상대를 확인
        const currentConversation = get().currentConversation;
        if (!currentConversation) return;

        // conversationId를 찾기 위해 conversations에서 매칭되는 대화 찾기
        const conversations = get().conversations;
        const conversation = conversations.find(
            (conv) => conv.other_user_id === currentConversation,
        );
        if (!conversation) return;

        const conversationKey = conversation.conversation_id.toString();

        set((state) => {
            // 중복 메시지 체크
            const existingMessages = state.messages[conversationKey] || [];
            const isDuplicate = existingMessages.some(
                (existingMsg) => existingMsg.message_id === message.message_id,
            );

            if (isDuplicate) {
                return state;
            }

            // 현재 대화 상대의 정보를 찾아서 sender 정보 설정
            const currentUser = state.currentUserInfo;
            const senderName =
                message.sender_name ||
                (currentUser && message.sender_id === currentUser.user_id ? currentUser.name : '');
            const senderProfileImg =
                message.sender_profile_img ||
                (currentUser && message.sender_id === currentUser.user_id
                    ? currentUser.profile_img
                    : '');

            return {
                messages: {
                    ...state.messages,
                    [conversationKey]: [
                        ...existingMessages,
                        {
                            message_id: message.message_id,
                            sender_id: message.sender_id,
                            receiver_id: message.receiver_id,
                            content: message.content,
                            created_at: message.created_at,
                            is_read: 0,
                            sender_name: senderName,
                            sender_profile_img: senderProfileImg,
                        },
                    ],
                },
            };
        });
    },

    markConversationAsRead: async (userId, otherUserId) => {
        try {
            await markConversationAsRead(userId, otherUserId);
            set((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.other_user_id === otherUserId ? { ...conv, unread_count: 0 } : conv,
                ),
                unreadCount: Math.max(
                    0,
                    state.unreadCount -
                        (state.conversations.find((c) => c.other_user_id === otherUserId)
                            ?.unread_count || 0),
                ),
            }));
        } catch (error) {
            // 대화 읽음 처리 실패 시 무시
        }
    },

    sendMessage: async (receiverId, content) => {
        try {
            const currentUser = get().currentUserInfo;
            if (!currentUser) {
                throw new Error('사용자 정보가 없습니다.');
            }

            const result = await sendMessageApi(currentUser.user_id, receiverId, content);

            // 메시지가 성공적으로 전송되면 로컬에 추가
            const message: WebSocketMessage = {
                message_id: result.messageId,
                sender_id: currentUser.user_id,
                receiver_id: receiverId,
                content,
                created_at: new Date().toISOString(),
                sender_name: currentUser.name,
                sender_profile_img: currentUser.profile_img,
            };

            get().addMessage(message);

            // 새 채팅방이 생성된 경우에만 대화목록 갱신
            // (conversationId가 새로 생성되었는지 확인)
            if (result.conversationId && result.conversationId > 0) {
                // 기존 대화인지 확인
                const existingConversation = get().conversations.find(
                    (conv) => conv.conversation_id === result.conversationId,
                );

                if (!existingConversation) {
                    // 새 채팅방이면 대화목록 갱신
                    await get().loadConversationsWithUnread(currentUser.user_id);
                }
            }
        } catch (error) {
            throw error;
        }
    },

    // Users
    searchUsers: async (name, excludeUserId) => {
        try {
            const result = await searchUsers(name, excludeUserId);
            return result;
        } catch (error) {
            return [];
        }
    },

    updateUnreadCount: (count) => {
        set({ unreadCount: count });
    },

    // Online users
    setOnlineUsers: (userIds) => {
        set({ onlineUsers: userIds });
    },

    // Connection
    setConnectionStatus: (isConnected) => {
        set({ isConnected });
    },

    // Reset
    reset: () => set(initialState),
}));
