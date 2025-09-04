'use client';

import { Avatar, Button, Card, message, Upload, Spin } from 'antd';
import { UserOutlined, PictureOutlined, SendOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { useSocialProfile, usePostMutations } from '../_hooks';
import { validateImageFile } from '../_utils';

export default function PostComposer() {
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | undefined>();
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // localStorage에서 user_idx 가져오기
    useEffect(() => {
        const userId = localStorage.getItem('user_idx');
        if (userId) {
            setCurrentUserId(userId);
        }
    }, []);

    // 사용자 프로필 데이터 가져오기
    const {
        data: profile,
        isLoading: profileLoading,
        error: profileError,
    } = useSocialProfile(currentUserId);

    // 포스트 뮤테이션 훅
    const { createPost } = usePostMutations(parseInt(currentUserId));

    // React Hook Form 설정
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        watch,
        reset,
    } = useForm({
        mode: 'onChange',
    });

    const content = watch('content', '');

    // 포스트 생성 성공 시 폼 리셋
    useEffect(() => {
        if (createPost.isSuccess) {
            reset();
            setMediaFile(null);
            setMediaPreview(undefined);
        }
    }, [createPost.isSuccess, reset]);

    const onSubmit = (data: any) => {
        createPost.mutate({
            content: data.content,
            imageFile: mediaFile || undefined,
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(onSubmit)();
        }
    };

    // 로딩 상태 처리
    if (profileLoading) {
        return (
            <Card className='mb-6'>
                <div className='flex justify-center items-center h-32'>
                    <Spin size='large' />
                </div>
            </Card>
        );
    }

    // 에러 상태 처리
    if (profileError || !profile) {
        return (
            <Card className='mb-6'>
                <div className='flex justify-center items-center h-32'>
                    <div className='text-center'>
                        <p className='text-gray-500'>프로필을 불러올 수 없습니다.</p>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className='mb-6'>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className='flex gap-2 items-start mb-4'>
                    <Avatar size={40} src={profile.profileImage} icon={<UserOutlined />} />
                    <div className='flex-1'>
                        <textarea
                            {...register('content', {
                                required: '내용을 입력해주세요.',
                                minLength: {
                                    value: 1,
                                    message: '내용을 입력해주세요.',
                                },
                                maxLength: {
                                    value: 500,
                                    message: '500자 이하로 입력해주세요.',
                                },
                            })}
                            placeholder='무슨 생각을 하고 계신가요?'
                            className={`w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.content ? 'border-red-500' : 'border-gray-300'
                            }`}
                            rows={3}
                            onKeyDown={handleKeyPress}
                        />
                        {errors.content && (
                            <p className='text-red-500 text-sm mt-1'>
                                {errors.content.message as string}
                            </p>
                        )}
                        <div className='flex justify-between items-center mt-1'>
                            <span
                                className={`text-sm ${content.length > 450 ? 'text-red-500' : 'text-gray-500'}`}
                            >
                                {content.length}/500
                            </span>
                        </div>
                        {mediaPreview && (
                            <div className='mt-2 relative'>
                                <Image
                                    src={mediaPreview}
                                    alt='미리보기'
                                    width={128}
                                    height={128}
                                    className='w-32 h-32 object-cover rounded-lg'
                                />
                                <button
                                    type='button'
                                    onClick={() => {
                                        setMediaFile(null);
                                        setMediaPreview(undefined);
                                    }}
                                    className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600'
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className='flex justify-between items-center'>
                    <div className='flex space-x-4'>
                        <Upload
                            accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
                            showUploadList={false}
                            beforeUpload={(file) => {
                                // 파일 유효성 검사
                                const validation = validateImageFile(file);
                                if (!validation.isValid) {
                                    message.error(validation.error);
                                    return false;
                                }

                                // Local에 파일 저장 및 미리보기 생성
                                setMediaFile(file);

                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    setMediaPreview(e.target?.result as string);
                                };
                                reader.readAsDataURL(file);

                                return false; // 자동 업로드 방지
                            }}
                        >
                            <Button icon={<PictureOutlined />} type='text'>
                                사진
                            </Button>
                        </Upload>
                    </div>
                    <Button
                        type='primary'
                        icon={<SendOutlined />}
                        htmlType='submit'
                        loading={createPost.isPending}
                        disabled={!isValid || !content.trim()}
                    >
                        게시
                    </Button>
                </div>
            </form>
        </Card>
    );
}
