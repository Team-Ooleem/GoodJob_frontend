'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TimeTable from './TimeTable';
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
        .max(2000, '설명은 2000자 이하로 입력해주세요'),
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

// DAYS_OF_WEEK와 HOUR_SLOTS는 TimeTable 컴포넌트로 이동

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

    const handleTimeSlotsChange = (newTimeSlots: TimeSlot[]) => {
        setTimeSlots(newTimeSlots);
        setValue('slots', newTimeSlots);
    };

    const onFormSubmit = (data: MentoringProductFormData) => {
        // mentor_idx는 상위 컴포넌트에서 설정됨
        const submitData: CreateMentoringProductRequest = {
            ...data,
            mentor_idx: 0, // 상위 컴포넌트에서 실제 값으로 덮어씌워짐
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
                        <MarkdownEditor
                            value={watch('description')}
                            onChange={(value) => setValue('description', value || '')}
                            placeholder='멘토링의 내용과 특징을 마크다운으로 자세히 설명해주세요'
                            height={300}
                            dataColorMode='auto'
                            preview='live'
                            visibleDragbar={false}
                        />
                        {errors.description && (
                            <p className='text-sm text-red-500'>{errors.description.message}</p>
                        )}
                        <p className='text-xs text-muted-foreground'>
                            마크다운 문법을 사용하여 작성해주세요. (예: **굵은글씨**, *기울임*,
                            `코드` 등)
                        </p>
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
            <TimeTable timeSlots={timeSlots} onTimeSlotsChange={handleTimeSlotsChange} />

            {errors.slots && <p className='text-sm text-red-500'>{errors.slots.message}</p>}

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
