'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, message, Typography, Space, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getProfile, updateProfile } from '@/apis/profile-api';
import { Profile } from '@/types/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ProfileInputPage() {
    const router = useRouter();
    const [shortBio, setShortBio] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // 프로필 데이터 로드
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setInitialLoading(true);
                const response = await getProfile();
                if (response.success) {
                    setShortBio(response.data.profile.short_bio || '');
                    setBio(response.data.profile.bio || '');
                }
            } catch (error) {
                // 프로필이 없는 경우는 정상적인 상황일 수 있음
                console.log('No existing profile found');
            } finally {
                setInitialLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleShortBioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length <= 40) {
            setShortBio(value);
        } else {
            message.warning('한 줄 소개는 40자를 초과할 수 없습니다.');
        }
    };

    const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= 300) {
            setBio(value);
        } else {
            message.warning('간단 소개글은 300자를 초과할 수 없습니다.');
        }
    };

    const handleSave = async () => {
        // 유효성 검사
        if (shortBio.length > 40) {
            message.error('한 줄 소개는 40자를 초과할 수 없습니다.');
            return;
        }
        if (bio.length > 300) {
            message.error('간단 소개글은 300자를 초과할 수 없습니다.');
            return;
        }

        try {
            setLoading(true);
            const response = await updateProfile({
                short_bio: shortBio,
                bio: bio,
            });

            if (response.success) {
                message.success('프로필이 저장되었습니다.');
                // 메인 페이지로 이동
                router.push('/');
            } else {
                message.error('프로필 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error('네트워크 연결을 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrevious = () => {
        // 희망 연봉 선택 페이지로 이동
        router.push('/salary-selection');
    };

    if (initialLoading) {
        return (
            <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
                    <Text>프로필을 불러오는 중...</Text>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gray-50 py-8'>
            <div className='max-w-2xl mx-auto px-4'>
                {/* Header */}
                <div className='flex justify-between items-center mb-8'>
                    <div className='text-2xl font-bold'>Logo</div>
                    <Space size='large'>
                        <Button type='text'>채용 정보</Button>
                        <Button type='text'>인맥 관리</Button>
                        <Button type='text'>이력서 코칭</Button>
                    </Space>
                </div>

                {/* 프로필 입력 섹션 */}
                <Card className='mb-8'>
                    <div className='text-center mb-8'>
                        <UserOutlined className='text-4xl text-blue-600 mb-4' />
                        <Title level={3}>프로필을 입력해주세요</Title>
                    </div>

                    <div className='space-y-6'>
                        {/* 한 줄 소개 */}
                        <div>
                            <Text strong className='text-lg block mb-3'>
                                한 줄 소개
                            </Text>
                            <div className='relative'>
                                <Input
                                    placeholder='예: 안녕하세요! 긍정의 스위치, 김조이입니다.'
                                    value={shortBio}
                                    onChange={handleShortBioChange}
                                    className='w-full h-12 text-base'
                                    maxLength={40}
                                />
                                <div className='absolute bottom-2 right-3 text-xs text-gray-500'>
                                    <span className={shortBio.length > 40 ? 'text-red-500' : ''}>
                                        {shortBio.length}/40
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 간단 소개글 */}
                        <div>
                            <Text strong className='text-lg block mb-3'>
                                간단 소개글
                            </Text>
                            <div className='relative'>
                                <TextArea
                                    placeholder='자신을 어필할 수 있는 간단한 소개글을 작성해주세요.'
                                    value={bio}
                                    onChange={handleBioChange}
                                    className='w-full min-h-[100px] text-base resize-none'
                                    maxLength={300}
                                    rows={4}
                                />
                                <div className='absolute bottom-2 right-3 text-xs text-gray-500'>
                                    <span className={bio.length > 300 ? 'text-red-500' : ''}>
                                        {bio.length}/300
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 네비게이션 버튼 */}
                <div className='flex justify-between'>
                    <Button
                        size='large'
                        className='px-8 h-12 bg-gray-100 text-gray-700 border-gray-300'
                        onClick={handlePrevious}
                    >
                        이전
                    </Button>
                    <Button
                        type='primary'
                        size='large'
                        className='px-8 h-12 bg-blue-600 hover:bg-blue-700 border-blue-600'
                        onClick={handleSave}
                        loading={loading}
                        disabled={loading}
                    >
                        완료
                    </Button>
                </div>
            </div>
        </div>
    );
}
