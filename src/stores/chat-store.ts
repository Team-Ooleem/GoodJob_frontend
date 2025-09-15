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
    addMessage: (message: WebSocketMessage, currentUserId: number) => void;
    markConversationAsRead: (userId: number, otherUserId: number) => Promise<void>;
    sendMessage: (receiverId: number, content: string, currentUserId: number) => Promise<void>;

    // Users
    searchUsers: (name: string, excludeUserId: number) => Promise<ChatUser[]>;

    // Unread count
    updateUnreadCount: (count: number) => void;

    // Online users
    setOnlineUsers: (userIds: number[]) => void;

    // Connection
    setConnectionStatus: (isConnected: boolean) => void;

    // WebSocket integration
    webSocketSendMessage?: (receiverId: number, content: string) => void;

    // Direct chat functions
    startChatWithUser: (userInfo: ChatUser, currentUserId: number) => void;

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

    addMessage: (message, currentUserId) => {
        if (!currentUserId) {
            return;
        }

        // 메시지의 발신자/수신자 중 현재 사용자가 아닌 상대방 ID 찾기
        const otherUserId =
            message.sender_id === currentUserId ? message.receiver_id : message.sender_id;

        // conversations에서 해당 상대방과의 대화 찾기
        const state = get();
        let conversation = state.conversations.find((conv) => conv.other_user_id === otherUserId);

        // 대화를 찾지 못한 경우 처리
        if (!conversation) {
            // 임시 conversation 생성하여 메시지 저장
            const tempConversationId = `temp_${otherUserId}`;

            set((currentState) => {
                const existingMessages = currentState.messages[tempConversationId] || [];

                return {
                    messages: {
                        ...currentState.messages,
                        [tempConversationId]: [
                            ...existingMessages,
                            {
                                message_id: message.message_id,
                                sender_id: message.sender_id,
                                receiver_id: message.receiver_id,
                                content: message.content,
                                created_at: message.created_at,
                                is_read: 0,
                                sender_name: message.sender_name || '사용자',
                                sender_profile_img: message.sender_profile_img || '',
                            },
                        ],
                    },
                };
            });

            // 백그라운드에서 대화 목록 로드
            get()
                .loadConversationsWithUnread(currentUserId)
                .then(() => {
                    const updatedState = get();
                    const foundConversation = updatedState.conversations.find(
                        (conv) => conv.other_user_id === otherUserId,
                    );

                    if (foundConversation) {
                        // 임시 메시지를 정식 conversation으로 이동
                        const tempMessages = updatedState.messages[tempConversationId] || [];
                        const realConversationKey = foundConversation.conversation_id.toString();

                        set((state) => {
                            const newMessages = { ...state.messages };
                            if (tempMessages.length > 0) {
                                newMessages[realConversationKey] = [
                                    ...(newMessages[realConversationKey] || []),
                                    ...tempMessages,
                                ];
                                delete newMessages[tempConversationId];
                            }
                            return { messages: newMessages };
                        });
                    }
                });
            return;
        }

        const conversationKey = conversation.conversation_id.toString();

        set((state) => {
            const existingMessages = state.messages[conversationKey] || [];

            // sender 정보는 웹소켓 메시지에서 제공되는 정보 사용
            const senderName =
                message.sender_name ||
                (message.sender_id !== currentUserId ? conversation.other_user_name : '나');
            const senderProfileImg =
                message.sender_profile_img ||
                (message.sender_id !== currentUserId ? conversation.other_user_profile_img : '');

            const newMessage = {
                message_id: message.message_id,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                content: message.content,
                created_at: message.created_at,
                is_read: 0,
                sender_name: senderName,
                sender_profile_img: senderProfileImg,
            };

            return {
                messages: {
                    ...state.messages,
                    [conversationKey]: [...existingMessages, newMessage],
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

    sendMessage: async (receiverId, content, currentUserId) => {
        try {
            const webSocketSendMessage = get().webSocketSendMessage;

            if (!currentUserId) {
                throw new Error('로그인이 필요합니다.');
            }

            // 1. 먼저 API를 통해 메시지를 DB에 저장
            const result = await sendMessageApi(currentUserId, receiverId, content);

            // 2. 임시 메시지를 로컬에 즉시 추가 (UI 즉시 반영)
            const tempMessage: WebSocketMessage = {
                message_id: result.messageId,
                sender_id: currentUserId,
                receiver_id: receiverId,
                content,
                created_at: new Date().toISOString(),
                sender_name: '나', // 현재 사용자는 '나'로 표시
                sender_profile_img: '', // 프로필 이미지는 나중에 설정
            };

            get().addMessage(tempMessage, currentUserId);

            // 3. WebSocket을 통해 실시간 전송 (상대방에게 알림)
            if (webSocketSendMessage) {
                webSocketSendMessage(receiverId, content);
            } else {
                console.log('⚠️ [STORE] WebSocket 함수가 없음');
            }

            // 4. 새 채팅방이 생성된 경우 대화목록 갱신
            if (result.conversationId && result.conversationId > 0) {
                const existingConversation = get().conversations.find(
                    (conv) => conv.conversation_id === result.conversationId,
                );

                if (!existingConversation) {
                    await get().loadConversationsWithUnread(currentUserId);
                }
            }
        } catch (error) {
            console.error('Message send error:', error);
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

    // Direct chat functions
    startChatWithUser: (userInfo, currentUserId) => {
        // 채팅창 열기
        set({ isOpen: true });

        // 현재 대화 상대 설정
        set({ currentConversation: userInfo.user_id });

        // 사용자 정보 설정
        set({ currentUserInfo: userInfo });

        if (currentUserId) {
            // 해당 사용자와의 메시지 로드
            get().loadMessagesByUsers(currentUserId, userInfo.user_id);

            // 대화 목록도 갱신
            get().loadConversationsWithUnread(currentUserId);
        }
    },

    // Reset
    reset: () => set(initialState),
}));
