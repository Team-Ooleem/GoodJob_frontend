'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, message, Typography, Space, Input, Upload, Avatar } from 'antd';
import { UserOutlined, CameraOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    updateProfile,
    uploadProfileImage,
    getOnboardingData,
    completeOnboarding,
} from '@/apis/(onboarding)/profile-api';
import { Profile } from '@/types/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ProfileInputPage() {
    const router = useRouter();
    const [shortBio, setShortBio] = useState('');
    const [bio, setBio] = useState('');
    const [profileImg, setProfileImg] = useState<string | undefined>(undefined);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

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

    const handleImageUpload = async (info: any) => {
        const { file } = info;

        // 이미지 파일 유효성 검사
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('이미지 파일만 업로드 가능합니다.');
            return;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('이미지 크기는 2MB 이하여야 합니다.');
            return;
        }

        try {
            setUploading(true);

            // 실제 이미지 업로드 API 호출
            const response = await uploadProfileImage(file);

            if (response.success && response.imageUrl) {
                setProfileImg(response.imageUrl);
                message.success('이미지가 업로드되었습니다.');
            } else {
                message.error(response.message || '이미지 업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            message.error('이미지 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const handleImageRemove = () => {
        setProfileImg(undefined);
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

            // 1. 프로필 정보 저장
            const profileResponse = await updateProfile({
                short_bio: shortBio,
                bio: bio,
                profile_img: profileImg,
            });

            if (!profileResponse.success) {
                message.error('프로필 저장에 실패했습니다.');
                return;
            }

            // 2. 온보딩 데이터 조회
            const onboardingDataResponse = await getOnboardingData();

            if (!onboardingDataResponse.success || !onboardingDataResponse.data) {
                message.error('온보딩 데이터를 불러올 수 없습니다.');
                return;
            }

            // 3. 온보딩 완료 API 호출
            const onboardingResponse = await completeOnboarding(onboardingDataResponse.data);

            if (onboardingResponse.success) {
                message.success('온보딩이 완료되었습니다!');
                // 온보딩 완료 후 메인 페이지로 이동
                router.push('/');
            } else {
                message.error('온보딩 완료 처리에 실패했습니다.');
            }
        } catch (error: any) {
            console.error('Error during onboarding completion:', error);

            // 에러 타입에 따른 처리
            if (error instanceof TypeError && error.message.includes('fetch')) {
                message.error('네트워크 연결을 확인해주세요.');
            } else if (error.response?.status >= 500) {
                message.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } else if (error.response?.status >= 400) {
                message.error('잘못된 요청입니다. 입력 정보를 확인해주세요.');
            } else {
                message.error('예상치 못한 오류가 발생했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrevious = () => {
        // 희망 연봉 선택 페이지로 이동
        router.push('/salary-selection');
    };

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
                        <Title level={3}>프로필을 입력해주세요</Title>
                    </div>

                    <div className='flex gap-8'>
                        {/* 왼쪽: 프로필 사진 업로드 */}
                        <div className='flex-shrink-0 text-center'>
                            <Text strong className='text-lg block mb-4'>
                                프로필 사진
                            </Text>
                            <div className='relative'>
                                {profileImg ? (
                                    <div className='flex flex-col items-center'>
                                        <Avatar
                                            size={120}
                                            src={profileImg}
                                            className='border-2 border-blue-600'
                                        />
                                        <Button
                                            type='text'
                                            danger
                                            icon={<DeleteOutlined />}
                                            size='small'
                                            className='mt-2 bg-white rounded-full shadow-md'
                                            onClick={handleImageRemove}
                                        />
                                    </div>
                                ) : (
                                    <Upload
                                        accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
                                        showUploadList={false}
                                        beforeUpload={() => false}
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    >
                                        <div
                                            className={`w-30 h-30 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-blue-600 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            style={{ width: '120px', height: '120px' }}
                                        >
                                            {uploading ? (
                                                <div className='text-center'>
                                                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1'></div>
                                                    <div className='text-xs text-gray-500'>
                                                        업로드 중...
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className='text-center'>
                                                    <UserOutlined className='text-4xl text-gray-400' />
                                                </div>
                                            )}
                                        </div>
                                    </Upload>
                                )}
                            </div>
                        </div>

                        {/* 오른쪽: 텍스트 입력 */}
                        <div className='flex-1 space-y-6'>
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
                                        <span
                                            className={shortBio.length > 40 ? 'text-red-500' : ''}
                                        >
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
