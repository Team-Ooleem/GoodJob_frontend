'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { MentoringProduct } from '../_apis/mentoring-product-api';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
    }).format(price);
};

export const productColumns = (onChanged?: () => void): ColumnDef<MentoringProduct>[] => [
    {
        header: '상품명',
        accessorKey: 'title',
        cell: ({ getValue }) => (
            <span className='font-medium line-clamp-2 max-w-[300px]'>
                {String(getValue() ?? '')}
            </span>
        ),
    },
    {
        header: '설명',
        accessorKey: 'description',
        cell: ({ getValue }) => (
            <span className='text-sm text-muted-foreground line-clamp-2 max-w-[400px]'>
                {String(getValue() ?? '')}
            </span>
        ),
    },
    {
        header: '가격',
        accessorKey: 'price',
        cell: ({ getValue }) => (
            <span className='font-semibold text-green-600'>
                {formatPrice(Number(getValue() ?? 0))}
            </span>
        ),
    },
    {
        header: '직무 카테고리',
        accessorKey: 'job_category',
        cell: ({ getValue }) => <Badge variant='outline'>{String(getValue() ?? '')}</Badge>,
    },
];
