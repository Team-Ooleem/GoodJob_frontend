'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import {
    CreateMentoringProductRequest,
    TimeSlot,
    JobCategory,
} from '@/app/admin/_apis/mentoring-product-api';

// 폼 검증 스키마
const mentoringProductSchema = z.object({
    title: z
        .string()
        .min(1, '상품 제목을 입력해주세요')
        .max(100, '제목은 100자 이하로 입력해주세요'),
    job_category_id: z.number().min(1, '직무 카테고리를 선택해주세요'),
    description: z
        .string()
        .min(1, '상품 설명을 입력해주세요')
        .max(1000, '설명은 1000자 이하로 입력해주세요'),
    price: z.number().min(0, '가격은 0원 이상이어야 합니다'),
    slots: z
        .array(
            z.object({
                day_of_week: z.number().min(1).max(7),
                hour_slot: z.number().min(0).max(23),
            }),
        )
        .min(1, '최소 하나의 시간대를 선택해주세요'),
});

type MentoringProductFormData = z.infer<typeof mentoringProductSchema>;

interface MentoringProductFormProps {
    jobCategories: JobCategory[];
    onSubmit: (data: CreateMentoringProductRequest) => Promise<void>;
    isLoading?: boolean;
}

const DAYS_OF_WEEK = [
    { value: 1, label: '월요일' },
    { value: 2, label: '화요일' },
    { value: 3, label: '수요일' },
    { value: 4, label: '목요일' },
    { value: 5, label: '금요일' },
    { value: 6, label: '토요일' },
    { value: 7, label: '일요일' },
];

const HOUR_SLOTS = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`,
}));

export default function MentoringProductForm({
    jobCategories,
    onSubmit,
    isLoading = false,
}: MentoringProductFormProps) {
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<MentoringProductFormData>({
        resolver: zodResolver(mentoringProductSchema),
        defaultValues: {
            title: '',
            job_category_id: 0,
            description: '',
            price: 0,
            slots: [],
        },
    });

    const addTimeSlot = () => {
        setTimeSlots([...timeSlots, { day_of_week: 1, hour_slot: 9 }]);
    };

    const removeTimeSlot = (index: number) => {
        const newSlots = timeSlots.filter((_, i) => i !== index);
        setTimeSlots(newSlots);
        setValue('slots', newSlots);
    };

    const updateTimeSlot = (index: number, field: keyof TimeSlot, value: number) => {
        const newSlots = [...timeSlots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setTimeSlots(newSlots);
        setValue('slots', newSlots);
    };

    const onFormSubmit = (data: MentoringProductFormData) => {
        // mentor_idx를 기본값으로 설정 (예: 1 또는 관리자 ID)
        const submitData: CreateMentoringProductRequest = {
            ...data,
            mentor_idx: 1, // 기본 멘토 ID 또는 관리자 ID
        };
        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className='space-y-8'>
            {/* 기본 정보 */}
            <Card className='shadow-sm'>
                <CardHeader className='pb-4'>
                    <CardTitle className='text-xl'>기본 정보</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                        <Label htmlFor='title'>상품 제목</Label>
                        <Input
                            id='title'
                            {...register('title')}
                            placeholder='예: 프론트엔드 면접 대비 1:1 멘토링'
                        />
                        {errors.title && (
                            <p className='text-sm text-red-500'>{errors.title.message}</p>
                        )}
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='description'>상품 설명</Label>
                        <Textarea
                            id='description'
                            {...register('description')}
                            placeholder='멘토링의 내용과 특징을 자세히 설명해주세요'
                            rows={4}
                        />
                        {errors.description && (
                            <p className='text-sm text-red-500'>{errors.description.message}</p>
                        )}
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='job_category_id'>직무 카테고리</Label>
                        <Select
                            onValueChange={(value) => setValue('job_category_id', parseInt(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder='카테고리를 선택하세요' />
                            </SelectTrigger>
                            <SelectContent>
                                {jobCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.job_category_id && (
                            <p className='text-sm text-red-500'>{errors.job_category_id.message}</p>
                        )}
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='price'>가격 (원)</Label>
                        <Input
                            id='price'
                            type='number'
                            {...register('price', { valueAsNumber: true })}
                            placeholder='50000'
                        />
                        {errors.price && (
                            <p className='text-sm text-red-500'>{errors.price.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 시간대 설정 */}
            <Card className='shadow-sm'>
                <CardHeader className='pb-4'>
                    <CardTitle className='text-xl'>가능한 시간대 설정</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                            <Label>시간대 목록</Label>
                            <Button
                                type='button'
                                variant='outline'
                                size='sm'
                                onClick={addTimeSlot}
                                className='flex items-center gap-2'
                            >
                                <Plus className='h-4 w-4' />
                                시간대 추가
                            </Button>
                        </div>

                        {timeSlots.length === 0 ? (
                            <p className='text-sm text-gray-500'>시간대를 추가해주세요</p>
                        ) : (
                            <div className='space-y-2'>
                                {timeSlots.map((slot, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center gap-2 p-3 border rounded-lg'
                                    >
                                        <Select
                                            value={slot.day_of_week.toString()}
                                            onValueChange={(value) =>
                                                updateTimeSlot(
                                                    index,
                                                    'day_of_week',
                                                    parseInt(value),
                                                )
                                            }
                                        >
                                            <SelectTrigger className='w-32'>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS_OF_WEEK.map((day) => (
                                                    <SelectItem
                                                        key={day.value}
                                                        value={day.value.toString()}
                                                    >
                                                        {day.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Select
                                            value={slot.hour_slot.toString()}
                                            onValueChange={(value) =>
                                                updateTimeSlot(index, 'hour_slot', parseInt(value))
                                            }
                                        >
                                            <SelectTrigger className='w-24'>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {HOUR_SLOTS.map((hour) => (
                                                    <SelectItem
                                                        key={hour.value}
                                                        value={hour.value.toString()}
                                                    >
                                                        {hour.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            type='button'
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => removeTimeSlot(index)}
                                            className='text-red-500 hover:text-red-700'
                                        >
                                            <X className='h-4 w-4' />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.slots && (
                            <p className='text-sm text-red-500'>{errors.slots.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div className='flex justify-end space-x-4 pt-6'>
                <Button type='button' variant='outline' size='lg'>
                    취소
                </Button>
                <Button type='submit' disabled={isLoading} size='lg'>
                    {isLoading ? '등록 중...' : '상품 등록'}
                </Button>
            </div>
        </form>
    );
}
