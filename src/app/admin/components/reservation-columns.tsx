'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { Application } from '../_apis/mentoring-application-api';

const statusBadge = (s: Application['application_status']) => {
    const map: Record<
        Application['application_status'],
        { label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
        pending: { label: '대기', variant: 'secondary' },
        approved: { label: '승인', variant: 'default' },
        rejected: { label: '거절', variant: 'destructive' },
    };
    const { label, variant } = map[s] ?? { label: s, variant: 'outline' };
    return <Badge variant={variant}>{label}</Badge>;
};

export const applicationColumns = (): ColumnDef<Application>[] => [
    {
        header: '상태',
        accessorKey: 'application_status',
        cell: ({ row }) => statusBadge(row.original.application_status),
    },
    {
        header: '신청자',
        accessorKey: 'mentee.name',
        cell: ({ row }) => (
            <div className='flex items-center gap-2'>
                {/* 프로필 이미지가 있다면 */}
                {row.original.mentee.profile_img ? (
                    <img
                        src={row.original.mentee.profile_img}
                        alt={row.original.mentee.name}
                        className='h-6 w-6 rounded-full object-cover'
                    />
                ) : null}
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
        header: '예약일자',
        accessorKey: 'booked_date',
        cell: ({ getValue }) => {
            const v = String(getValue());
            // YYYY-MM-DD or ISO -> YYYY.MM.DD
            const d = v.slice(0, 10).replaceAll('-', '.');
            return <span className='tabular-nums text-muted-foreground'>{d}</span>;
        },
    },
];
