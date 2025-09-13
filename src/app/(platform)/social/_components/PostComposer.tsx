'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { User, Image as ImageIcon, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { useMyProfile, usePostMutations } from '../_hooks';
import { validateImageFile } from '../_utils';

interface PostComposerProps {
    currentUserId: number;
}

export default function PostComposer({ currentUserId }: PostComposerProps) {
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | undefined>();

    // 내 프로필 데이터 가져오기
    const { data: profile, isLoading: profileLoading, error: profileError } = useMyProfile();

    // 포스트 뮤테이션 훅
    const { createPost } = usePostMutations(currentUserId);

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
                <CardContent className='flex justify-center items-center h-32'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </CardContent>
            </Card>
        );
    }

    // 에러 상태 처리
    if (profileError || !profile) {
        return (
            <Card className='mb-6'>
                <CardContent className='flex justify-center items-center h-32'>
                    <div className='text-center'>
                        <p className='text-muted-foreground'>프로필을 불러올 수 없습니다.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className='mb-6'>
            <CardContent className='p-6'>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className='flex gap-3 items-start mb-4'>
                        <Avatar className='h-10 w-10'>
                            <AvatarImage src={profile.profileImage} alt={profile.name} />
                            <AvatarFallback>
                                <User className='h-5 w-5' />
                            </AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                            <Textarea
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
                                className={`resize-none ${
                                    errors.content ? 'border-destructive' : ''
                                }`}
                                rows={3}
                                onKeyDown={handleKeyPress}
                            />
                            {errors.content && (
                                <p className='text-destructive text-sm mt-1'>
                                    {errors.content.message as string}
                                </p>
                            )}
                            <div className='flex justify-between items-center mt-1'>
                                <span
                                    className={`text-sm ${
                                        content.length > 450
                                            ? 'text-destructive'
                                            : 'text-muted-foreground'
                                    }`}
                                >
                                    {content.length}/500
                                </span>
                            </div>
                            {mediaPreview && (
                                <div className='mt-3 relative inline-block'>
                                    <Image
                                        src={mediaPreview}
                                        alt='미리보기'
                                        width={128}
                                        height={128}
                                        className='w-32 h-32 object-cover rounded-lg'
                                    />
                                    <Button
                                        type='button'
                                        variant='destructive'
                                        size='sm'
                                        className='absolute -top-2 -right-2 h-6 w-6 rounded-full p-0'
                                        onClick={() => {
                                            setMediaFile(null);
                                            setMediaPreview(undefined);
                                        }}
                                    >
                                        ×
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='flex justify-between items-center'>
                        <div className='flex space-x-2'>
                            <input
                                type='file'
                                accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        // 파일 유효성 검사
                                        const validation = validateImageFile(file);
                                        if (!validation.isValid) {
                                            alert(validation.error);
                                            return;
                                        }

                                        // Local에 파일 저장 및 미리보기 생성
                                        setMediaFile(file);

                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            setMediaPreview(e.target?.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className='hidden'
                                id='image-upload'
                            />
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={() => document.getElementById('image-upload')?.click()}
                            >
                                <ImageIcon className='h-4 w-4 mr-2' />
                                사진
                            </Button>
                        </div>
                        <Button
                            type='submit'
                            disabled={!isValid || !content.trim() || createPost.isPending}
                        >
                            {createPost.isPending ? (
                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                            ) : (
                                <Send className='h-4 w-4 mr-2' />
                            )}
                            게시
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
