// =============Chat Types=============
export interface ChatUser {
    user_id: number;
    name: string;
    email: string;
    short_bio: string;
    profile_img: string;
    job_info: string;
}

export interface ChatMessage {
    message_id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    is_read: number;
    read_at?: string;
    sender_name: string;
    sender_profile_img: string;
}

export interface ChatConversation {
    conversation_id: number;
    other_user_id: number;
    other_user_name: string;
    other_user_profile_img: string;
    other_user_short_bio: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
    last_read_time: string;
}

export interface ChatApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    message_id?: number;
    conversation_id?: number;
}

export interface ChatUnreadCount {
    unreadCount: number;
}

export interface ChatConversationExists {
    exists: boolean;
}

export interface ChatStats {
    total_conversations: number;
    total_unread_messages: number;
    active_conversations_24h: number;
}

export interface ChatConversationId {
    conversation_id: number;
}

// WebSocket Event Types
export interface WebSocketMessage {
    message_id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    sender_name?: string;
    sender_profile_img?: string;
}

export interface WebSocketResponse {
    success?: boolean;
    message?: string;
    messageData?: WebSocketMessage;
    otherUserId?: number;
    unreadCount?: number;
}

export interface ChatState {
    isOpen: boolean;
    currentConversation: number | null;
    currentUserInfo: ChatUser | null;
    conversations: ChatConversation[];
    messages: { [key: string]: ChatMessage[] };
    unreadCount: number;
    onlineUsers: number[];
    isConnected: boolean;
}
