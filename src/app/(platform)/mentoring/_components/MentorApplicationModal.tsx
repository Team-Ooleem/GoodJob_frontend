'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { X, Mail, User, Phone, Briefcase, FileText, Link, Send } from 'lucide-react';

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

const FIELD_OPTIONS = [
    { value: 'development', label: '개발/프로그래밍' },
    { value: 'game-dev', label: '게임개발' },
    { value: 'security', label: '보안' },
    { value: 'marketing', label: '직무/마케팅/커리어' },
    { value: 'design', label: '디자인' },
];

export default function MentorApplicationModal({ isOpen, onClose }: MentorApplicationModalProps) {
    const [formData, setFormData] = useState<MentorApplicationForm>({
        email: '',
        name: '',
        phone: '',
        field: '',
        introduction: '',
        links: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 필수 필드 검증
    const isFormValid =
        formData.email.trim() !== '' &&
        formData.name.trim() !== '' &&
        formData.phone.trim() !== '' &&
        formData.field !== '' &&
        formData.introduction.trim() !== '';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // TODO: API 호출로 멘토 지원 데이터 전송
            console.log('멘토 지원 데이터:', formData);

            // 임시로 2초 대기
            await new Promise((resolve) => setTimeout(resolve, 2000));

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
        } catch (error) {
            console.error('멘토 지원 실패:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // 클라이언트 사이드에서만 포털 렌더링
    if (typeof window === 'undefined') return null;

    return createPortal(
        <div className='fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4'>
            {/* 배경 오버레이 */}
            <div className='absolute inset-0 bg-black/70 backdrop-blur-sm' onClick={onClose} />

            {/* 모달 컨텐츠 */}
            <Card className='relative w-full max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl rounded-lg sm:rounded-xl'>
                <CardHeader className='bg-gradient-to-r from-sky-500 to-blue-600 text-white p-2 sm:p-6'>
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
                    <p className='text-sky-100 text-sm sm:text-base'>
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
                            <div className='flex flex-wrap gap-2'>
                                {FIELD_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type='button'
                                        onClick={() => handleInputChange('field', option.value)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                            formData.field === option.value
                                                ? 'bg-sky-500 text-white shadow-md border border-transparent'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
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
                        <div className='pt-6 border-t'>
                            <Button
                                type='submit'
                                disabled={isSubmitting || !isFormValid}
                                className={`w-full px-8 py-6 flex items-center justify-center space-x-2 ${
                                    isFormValid && !isSubmitting
                                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white'
                                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
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
