'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { X, Mail, User, Phone, Briefcase, FileText, Link, Send } from 'lucide-react';
import { useJobCategories, useCreateMentorApplication } from '../_hooks/useMentorApplication';
import { CreateMentorApplicationDto } from '../_apis/mentor-api';

interface MentorApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MentorApplicationForm {
    email: string;
    name: string;
    phone: string;
    field: string;
    introduction: string;
    links: string;
}

export default function MentorApplicationModal({ isOpen, onClose }: MentorApplicationModalProps) {
    const [formData, setFormData] = useState<MentorApplicationForm>({
        email: '',
        name: '',
        phone: '',
        field: '',
        introduction: '',
        links: '',
    });
    const [error, setError] = useState<string | null>(null);

    // React Query 훅들
    const {
        data: categories = [],
        isLoading: categoriesLoading,
        error: categoriesError,
    } = useJobCategories();
    const { mutate: createApplication, isPending: isSubmitting } = useCreateMentorApplication();

    // 필수 필드 검증
    const isFormValid =
        formData.email.trim() !== '' &&
        formData.name.trim() !== '' &&
        formData.phone.trim() !== '' &&
        formData.field !== '' &&
        formData.introduction.trim() !== '';

    // 카테고리 에러 처리
    useEffect(() => {
        if (categoriesError) {
            setError('카테고리를 불러오는데 실패했습니다.');
        } else {
            setError(null);
        }
    }, [categoriesError]);

    // Body scroll lock when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.setProperty('overflow', 'hidden', 'important');
        } else {
            document.body.style.removeProperty('overflow');
        }

        // Cleanup on unmount
        return () => {
            document.body.style.removeProperty('overflow');
        };
    }, [isOpen]);

    const handleInputChange = (field: keyof MentorApplicationForm, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // API 요청 데이터 변환
        const applicationData: CreateMentorApplicationDto = {
            contact_email: formData.email,
            business_name: formData.name,
            contact_phone: formData.phone,
            preferred_field_id: parseInt(formData.field),
            introduction: formData.introduction,
            portfolio_link: formData.links || undefined,
        };

        createApplication(applicationData, {
            onSuccess: (result) => {
                if (result.success) {
                    // 성공 시 모달 닫기
                    onClose();
                    setFormData({
                        email: '',
                        name: '',
                        phone: '',
                        field: '',
                        introduction: '',
                        links: '',
                    });
                    alert(result.message);
                } else {
                    setError(result.message);
                }
            },
            onError: (error) => {
                console.error('멘토 지원 실패:', error);
                setError('멘토 지원 중 오류가 발생했습니다.');
            },
        });
    };

    if (!isOpen) return null;

    // 클라이언트 사이드에서만 포털 렌더링
    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className='fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4'>
            {/* 배경 오버레이 */}
            <div
                className='absolute inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm'
                onClick={onClose}
            />

            {/* 모달 컨텐츠 */}
            <Card className='relative w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl rounded-lg sm:rounded-xl bg-card dark:bg-slate-900 border-border dark:border-slate-700'>
                <CardHeader className='bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-600 dark:to-blue-700 text-white p-2 sm:p-6'>
                    <div className='flex items-center justify-between'>
                        <CardTitle className='text-xl sm:text-2xl font-bold flex items-center space-x-2 sm:space-x-3'>
                            <span>멘토 지원하기</span>
                        </CardTitle>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={onClose}
                            className='text-white hover:bg-white/20 p-2'
                        >
                            <X className='w-5 h-5' />
                        </Button>
                    </div>
                    <p className='text-sky-100 dark:text-sky-200 text-sm sm:text-base'>
                        당신의 경험을 나누고 싶다면, 지금 지원해보세요!
                    </p>
                </CardHeader>

                <CardContent className='p-4 sm:p-6 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)] overflow-y-auto'>
                    <form onSubmit={handleSubmit} className='space-y-6'>
                        {/* 이메일 */}
                        <div className='space-y-2'>
                            <Label
                                htmlFor='email'
                                className='text-sm font-semibold text-foreground flex items-center space-x-2'
                            >
                                <Mail className='w-4 h-4' />
                                <span>
                                    연락받을 이메일 <span className='text-red-500'>*</span>
                                </span>
                            </Label>
                            <Input
                                id='email'
                                type='email'
                                placeholder='example@email.com'
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className='w-full'
                                required
                            />
                        </div>

                        {/* 이름/닉네임/사업체명 */}
                        <div className='space-y-2'>
                            <Label
                                htmlFor='name'
                                className='text-sm font-semibold text-foreground flex items-center space-x-2'
                            >
                                <User className='w-4 h-4' />
                                <span>
                                    실명 또는 닉네임 또는 사업체명{' '}
                                    <span className='text-red-500'>*</span>
                                </span>
                            </Label>
                            <Input
                                id='name'
                                type='text'
                                placeholder='홍길동 또는 개발자김씨 또는 (주)회사명'
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className='w-full'
                                required
                            />
                        </div>

                        {/* 연락처 */}
                        <div className='space-y-2'>
                            <Label
                                htmlFor='phone'
                                className='text-sm font-semibold text-foreground flex items-center space-x-2'
                            >
                                <Phone className='w-4 h-4' />
                                <span>
                                    연락처 <span className='text-red-500'>*</span>
                                </span>
                            </Label>
                            <Input
                                id='phone'
                                type='tel'
                                placeholder='010-1234-5678'
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className='w-full'
                                required
                            />
                        </div>

                        {/* 희망분야 */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-semibold text-foreground flex items-center space-x-2'>
                                <Briefcase className='w-4 h-4' />
                                <span>
                                    희망분야 <span className='text-red-500'>*</span>
                                </span>
                            </Label>
                            {categoriesLoading ? (
                                <div className='flex items-center justify-center py-4'>
                                    <div className='w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin' />
                                    <span className='ml-2 text-sm text-muted-foreground'>
                                        카테고리 로딩 중...
                                    </span>
                                </div>
                            ) : error ? (
                                <div className='text-red-500 text-sm py-2'>{error}</div>
                            ) : (
                                <div className='flex flex-wrap gap-2'>
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            type='button'
                                            onClick={() =>
                                                handleInputChange('field', category.id.toString())
                                            }
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                formData.field === category.id.toString()
                                                    ? 'bg-sky-500 dark:bg-sky-600 text-white shadow-md border border-transparent'
                                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600'
                                            }`}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 자기소개 (마크다운 에디터) */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-semibold text-foreground flex items-center space-x-2'>
                                <FileText className='w-4 h-4' />
                                <span>
                                    나를 소개하는 글 <span className='text-red-500'>*</span>
                                </span>
                            </Label>
                            <MarkdownEditor
                                value={formData.introduction}
                                onChange={(value) => handleInputChange('introduction', value || '')}
                                placeholder='자신을 소개하는 글을 마크다운으로 작성해주세요...'
                                height={300}
                                dataColorMode='auto'
                                preview='live'
                                visibleDragbar={false}
                            />
                            <p className='text-xs text-muted-foreground'>
                                마크다운 문법을 사용하여 작성해주세요. (예: **굵은글씨**, *기울임*,
                                `코드` 등)
                            </p>
                        </div>

                        {/* 링크 */}
                        <div className='space-y-2'>
                            <Label
                                htmlFor='links'
                                className='text-sm font-semibold text-foreground flex items-center space-x-2'
                            >
                                <Link className='w-4 h-4' />
                                <span>나를 표현할 수 있는 링크</span>
                            </Label>
                            <Input
                                id='links'
                                type='url'
                                placeholder='https://github.com/username 또는 https://portfolio.com'
                                value={formData.links}
                                onChange={(e) => handleInputChange('links', e.target.value)}
                                className='w-full'
                            />
                            <p className='text-xs text-muted-foreground'>
                                포트폴리오, 블로그, GitHub, LinkedIn 등 하나의 URL을 입력해주세요
                            </p>
                        </div>

                        {/* 제출 버튼 */}
                        <div className='pt-6 border-t border-border dark:border-slate-700'>
                            <Button
                                type='submit'
                                disabled={isSubmitting || !isFormValid}
                                className={`w-full px-8 py-6 flex items-center justify-center space-x-2 ${
                                    isFormValid && !isSubmitting
                                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-600 dark:to-blue-700 hover:from-sky-600 hover:to-blue-700 dark:hover:from-sky-700 dark:hover:to-blue-800 text-white'
                                        : 'bg-gray-400 dark:bg-slate-600 text-gray-200 dark:text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                        <span>제출 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className='w-4 h-4' />
                                        <span>멘토 지원하기</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>,
        document.body,
    );
}
