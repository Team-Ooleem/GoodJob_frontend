'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { MentoringReview } from '../_apis/mentoring-review-api';

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

const renderStars = (rating: number) => {
    return (
        <div className='flex items-center gap-1'>
            {[...Array(5)].map((_, i) => (
                <span
                    key={i}
                    className={`text-sm ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                    ★
                </span>
            ))}
            <span className='ml-1 text-sm text-muted-foreground'>({rating})</span>
        </div>
    );
};

export const reviewColumns = (): ColumnDef<MentoringReview>[] => [
    {
        header: '리뷰어',
        accessorKey: 'mentee.name',
        cell: ({ row }) => (
            <div className='flex items-center gap-2'>
                {row.original.mentee.profile_img ? (
                    <img
                        src={row.original.mentee.profile_img}
                        alt={row.original.mentee.name}
                        className='h-6 w-6 rounded-full object-cover'
                    />
                ) : (
                    <div className='h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs'>
                        {row.original.mentee.name.charAt(0)}
                    </div>
                )}
                <span className='font-medium'>{row.original.mentee.name}</span>
            </div>
        ),
    },
    {
        header: '상품명',
        accessorKey: 'product_title',
        cell: ({ getValue }) => (
            <span className='font-medium line-clamp-2 max-w-[300px]'>
                {String(getValue() ?? '')}
            </span>
        ),
    },
    {
        header: '평점',
        accessorKey: 'rating',
        cell: ({ getValue }) => renderStars(Number(getValue() ?? 0)),
    },
    {
        header: '리뷰 내용',
        accessorKey: 'review_content',
        cell: ({ getValue }) => (
            <span className='text-sm text-muted-foreground line-clamp-2 max-w-[400px]'>
                {String(getValue() ?? '')}
            </span>
        ),
    },
    {
        header: '작성일',
        accessorKey: 'created_at',
        cell: ({ getValue }) => (
            <span className='text-sm text-muted-foreground tabular-nums'>
                {formatDate(String(getValue()))}
            </span>
        ),
    },
];
