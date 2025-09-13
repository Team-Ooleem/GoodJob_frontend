'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { MentoringProduct } from '../_apis/mentoring-product-api';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
    }).format(price);
};

const formatRating = (rating: number) => {
    return rating.toFixed(1);
};

export const productColumns = (onChanged?: () => void): ColumnDef<MentoringProduct>[] => [
    {
        header: '상품명',
        accessorKey: 'title',
        cell: ({ getValue }) => (
            <div className='max-w-[300px]'>
                <span className='font-medium line-clamp-2'>{String(getValue() ?? '')}</span>
            </div>
        ),
    },
    {
        header: '설명',
        accessorKey: 'description',
        cell: ({ getValue }) => (
            <div className='max-w-[400px]'>
                <span className='text-sm text-muted-foreground line-clamp-3'>
                    {String(getValue() ?? '')}
                </span>
            </div>
        ),
    },
    {
        header: '카테고리',
        accessorKey: 'job_category',
        cell: ({ getValue }) => (
            <Badge variant='outline' className='w-fit'>
                {String(getValue() ?? '')}
            </Badge>
        ),
    },
    {
        header: '가격',
        accessorKey: 'price',
        cell: ({ getValue }) => (
            <span className='font-medium text-green-600'>
                {formatPrice(Number(getValue() ?? 0))}
            </span>
        ),
    },
    {
        header: '평점',
        accessorKey: 'average_rating',
        cell: ({ getValue, row }) => {
            const rating = Number(getValue() ?? 0);
            return (
                <div className='flex items-center gap-1'>
                    <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                    <span className='font-medium'>{formatRating(rating)}</span>
                    <span className='text-sm text-muted-foreground'>
                        ({row.original.review_count}개 리뷰)
                    </span>
                </div>
            );
        },
    },
    {
        header: '멘티 수',
        accessorKey: 'mentee_count',
        cell: ({ getValue }) => (
            <span className='tabular-nums text-muted-foreground'>{String(getValue() ?? 0)}명</span>
        ),
    },
];
