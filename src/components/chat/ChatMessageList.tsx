'use client';

import { useState, useEffect, useRef } from 'react';
import { SendOutlined, ArrowLeftOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { useChatStore } from '@/stores/chat-store';
import { ChatMessage } from '@/types/chat';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button, message as antdMessage } from 'antd';
import { useCoachingResume } from '@/hooks/useCoachingResume';

interface ChatMessageListProps {
    userId: number;
    otherUserId: number;
    isConnected: boolean;
    onBack: () => void;
}

export const ChatMessageList = ({
    userId,
    otherUserId,
    isConnected,
    onBack,
}: ChatMessageListProps) => {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        messages,
        conversations,
        currentUserInfo,
        loadMessages,
        loadMessagesByUsers,
        addMessage,
        markConversationAsRead,
        sendMessage: sendMessageToStore,
    } = useChatStore();

    const { createCoachingCanvas } = useCoachingResume();

    // 현재 대화의 conversationId 찾기
    const currentConversation = conversations.find((conv) => conv.other_user_id === otherUserId);
    const conversationId = currentConversation?.conversation_id;
    const conversationKey = conversationId?.toString() || `temp_${otherUserId}`;
    const conversationMessages = messages[conversationKey] || [];

    // 현재 대화 상대의 정보 찾기
    const otherUserName = currentUserInfo?.name || '대화 상대';
    const otherUserProfileImg = currentUserInfo?.profile_img;

    useEffect(() => {
        // conversationId가 있으면 해당 대화의 메시지 로드
        if (conversationId) {
            loadMessages(conversationId);
        } else {
            // conversationId가 없으면 사용자 ID로 메시지 로드 시도
            loadMessagesByUsers(userId, otherUserId);
        }

        markConversationAsRead(userId, otherUserId);
    }, [
        userId,
        otherUserId,
        conversationId,
        loadMessages,
        loadMessagesByUsers,
        markConversationAsRead,
    ]);

    useEffect(() => {
        scrollToBottom();
    }, [conversationMessages]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest',
            });
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        const messageContent = message.trim();

        if (!isConnected) {
            alert('연결이 끊어졌습니다. 다시 시도해주세요.');
            return;
        }

        setMessage('');
        setIsLoading(true);

        try {
            // API를 통해 메시지 전송
            await sendMessageToStore(otherUserId, messageContent);
        } catch (error) {
            console.error('❌ [COMPONENT] sendMessageToStore 에러:', error);
            alert('메시지 전송에 실패했습니다.');
        } finally {
            setIsLoading(false);
            // 메시지 전송 완료 후 입력창에 포커스
            setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 이력서 코칭 요청 함수
    const handleCoachingRequest = () => {
        createCoachingCanvas.mutate(
            {
                name: '이력서 코칭',
                participantId: otherUserId,
            },
            {
                onSuccess: async (response) => {
                    // 성공 시 메시지로 링크 전송
                    const coachingUrl = `${window.location.origin}/coaching-resume/${response.id}`;
                    const coachingMessage = `📝 이력서 코칭에 참여하시겠습니까?\n\n링크: ${coachingUrl}`;

                    await sendMessageToStore(otherUserId, coachingMessage);
                    antdMessage.success('이력서 코칭 요청을 전송했습니다.');
                },
                onError: (error) => {
                    console.error('이력서 코칭 요청 실패:', error);
                    antdMessage.error('이력서 코칭 요청에 실패했습니다.');
                },
            },
        );
    };

    // 이력서 코칭 메시지인지 확인하는 함수
    const isCoachingMessage = (msg: ChatMessage) => {
        return (
            msg.content.includes('📝 이력서 코칭에 참여하시겠습니까?') &&
            msg.content.includes('링크:')
        );
    };

    // 이력서 코칭 메시지에서 정보 추출하는 함수
    const extractCoachingInfo = (msg: ChatMessage) => {
        const lines = msg.content.split('\n');
        const linkLine =
            lines
                .find((line) => line.startsWith('링크:'))
                ?.replace('링크:', '')
                .trim() || '';
        const sessionId = linkLine.split('/').pop() || '';

        return { sessionId, link: linkLine };
    };

    // 이력서 코칭 메시지 렌더링 함수
    const renderCoachingMessage = (msg: ChatMessage) => {
        const { sessionId, link } = extractCoachingInfo(msg);

        return (
            <a
                href={link}
                target='_blank'
                rel='noopener noreferrer'
                className='block max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow'
            >
                <div className='p-4'>
                    <div className='flex items-start gap-3'>
                        <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                            <FileTextOutlined className='text-blue-600 text-xl' />
                        </div>
                        <div className='flex-1 min-w-0'>
                            <h4 className='font-semibold text-gray-900 text-sm mb-1'>
                                이력서 코칭에 참여하시겠습니까?
                            </h4>
                            <div className='flex items-center text-xs text-blue-600'>
                                <span>coaching-resume.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        );
    };

    // 공통 입력 폼 컴포넌트
    const renderInputForm = () => (
        <div className='p-4 border-t border-gray-100 flex-shrink-0'>
            <div className='flex gap-2'>
                <input
                    ref={inputRef}
                    type='text'
                    placeholder={isConnected ? '메시지를 입력하세요...' : '연결 중...'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isLoading || !isConnected}
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed'
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || !isConnected || isLoading}
                    className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1'
                >
                    {isLoading ? (
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    ) : (
                        <SendOutlined />
                    )}
                </button>
            </div>
            {!isConnected && (
                <div className='text-xs text-red-500 mt-1'>
                    ⚠️ 연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.
                </div>
            )}
        </div>
    );

    return (
        <div className='h-full flex flex-col'>
            {/* 헤더 */}
            <div className='flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0'>
                <div className='flex items-center gap-2'>
                    <button
                        onClick={onBack}
                        className='p-1 hover:bg-gray-100 rounded transition-colors'
                    >
                        <ArrowLeftOutlined className='text-gray-500' />
                    </button>
                    <div className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden'>
                        {otherUserProfileImg ? (
                            <img
                                src={otherUserProfileImg}
                                alt={otherUserName}
                                className='w-full h-full object-cover'
                            />
                        ) : (
                            <UserOutlined className='text-gray-400' />
                        )}
                    </div>
                    <span className='font-medium'>{otherUserName}</span>
                </div>

                {/* 이력서 코칭 요청 버튼 */}
                <Button
                    type='primary'
                    size='small'
                    icon={<FileTextOutlined />}
                    onClick={handleCoachingRequest}
                    loading={createCoachingCanvas.isPending}
                    className='flex items-center gap-1 bg-green-500 hover:bg-green-600 border-green-500 hover:border-green-600'
                >
                    이력서 코칭 요청
                </Button>
            </div>

            {/* 메시지 영역 */}
            <div className='flex-1 p-4 overflow-y-auto'>
                {conversationMessages.length === 0 && !isLoading ? (
                    <div className='flex-1 flex items-center justify-center'>
                        <div className='text-center text-gray-500'>
                            <div className='text-4xl mb-2'>💬</div>
                            <div>아직 메시지가 없습니다</div>
                        </div>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {conversationMessages.map((msg) => {
                            const isOwnMessage = msg.sender_id === userId;
                            const isCoaching = isCoachingMessage(msg);

                            return (
                                <div
                                    key={msg.message_id}
                                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`flex gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {!isOwnMessage && (
                                            <div className='w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0'>
                                                {msg.sender_profile_img ? (
                                                    <img
                                                        src={msg.sender_profile_img}
                                                        alt='프로필'
                                                        className='w-full h-full object-cover'
                                                    />
                                                ) : (
                                                    <UserOutlined className='text-gray-400' />
                                                )}
                                            </div>
                                        )}
                                        <div
                                            className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                                        >
                                            {isCoaching ? (
                                                renderCoachingMessage(msg)
                                            ) : (
                                                <div
                                                    className={`px-3 py-2 rounded-lg ${
                                                        isOwnMessage
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-gray-100 text-gray-900'
                                                    }`}
                                                >
                                                    <span
                                                        className={
                                                            isOwnMessage
                                                                ? 'text-white'
                                                                : 'text-gray-900'
                                                        }
                                                    >
                                                        {msg.content}
                                                    </span>
                                                </div>
                                            )}
                                            <span className='text-xs text-gray-500 mt-1'>
                                                {format(new Date(msg.created_at), 'HH:mm', {
                                                    locale: ko,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력 폼 */}
            {renderInputForm()}
        </div>
    );
};
