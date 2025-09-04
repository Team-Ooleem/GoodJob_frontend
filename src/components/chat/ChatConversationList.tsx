'use client';

import { UserOutlined } from '@ant-design/icons';
import { ChatConversation, ChatUser } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ChatConversationListProps {
    conversations: ChatConversation[];
    onConversationSelect: (otherUserId: number, userInfo?: ChatUser) => void;
}

export const ChatConversationList = ({
    conversations,
    onConversationSelect,
}: ChatConversationListProps) => {
    if (conversations.length === 0) {
        return (
            <div className='h-full flex items-center justify-center'>
                <div className='text-center text-gray-500'>
                    <div className='text-4xl mb-2'>💬</div>
                    <div>아직 대화가 없습니다</div>
                </div>
            </div>
        );
    }

    return (
        <div className='h-full overflow-y-auto'>
            <div className='space-y-0'>
                {conversations.map((conversation) => (
                    <div
                        key={conversation.other_user_id}
                        className='cursor-pointer hover:bg-gray-50 px-4 py-3 border-b border-gray-100 transition-colors'
                        onClick={() => {
                            const userInfo = {
                                user_id: conversation.other_user_id,
                                name: conversation.other_user_name,
                                profile_img: conversation.other_user_profile_img,
                                short_bio: conversation.other_user_short_bio,
                                email: '', // 대화 목록에는 이메일이 없으므로 빈 문자열
                                job_info: conversation.other_user_short_bio,
                            };
                            onConversationSelect(conversation.other_user_id, userInfo);
                        }}
                    >
                        <div className='flex items-start gap-3'>
                            {/* 프로필 이미지와 읽지 않은 메시지 배지 */}
                            <div className='relative flex-shrink-0'>
                                <div className='w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden'>
                                    {conversation.other_user_profile_img ? (
                                        <img
                                            src={conversation.other_user_profile_img}
                                            alt={conversation.other_user_name}
                                            className='w-full h-full object-cover'
                                        />
                                    ) : (
                                        <UserOutlined className='text-gray-400 text-lg' />
                                    )}
                                </div>
                                {conversation.unread_count > 0 && (
                                    <div className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center'>
                                        {conversation.unread_count}
                                    </div>
                                )}
                            </div>

                            {/* 대화 정보 */}
                            <div className='flex-1 min-w-0'>
                                <div className='flex items-center justify-between mb-1'>
                                    <h3 className='font-medium text-gray-900 truncate'>
                                        {conversation.other_user_name}
                                    </h3>
                                    <span className='text-xs text-gray-500 flex-shrink-0 ml-2'>
                                        {formatDistanceToNow(
                                            new Date(conversation.last_message_time),
                                            {
                                                addSuffix: true,
                                                locale: ko,
                                            },
                                        )}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <p
                                        className={`text-sm truncate flex-1 mr-2 ${
                                            conversation.unread_count > 0
                                                ? 'font-semibold text-gray-900'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        {conversation.last_message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
