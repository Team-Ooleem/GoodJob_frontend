'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateApplication } from '../_apis/mentoring-application-api';
import type { Application } from '../_apis/mentoring-application-api';

// 전역 타입 선언
declare global {
    interface Window {
        openRejectionModal?: (application: Application) => void;
    }
}

const statusBadge = (s: Application['application_status']) => {
    const map: Record<
        Application['application_status'],
        { label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
        pending: { label: '대기', variant: 'secondary' },
        approved: { label: '승인', variant: 'default' },
        rejected: { label: '거절', variant: 'destructive' },
        completed: { label: '완료', variant: 'outline' },
        cancelled: { label: '취소', variant: 'destructive' },
    };
    const { label, variant } = map[s] ?? { label: s, variant: 'outline' };
    return <Badge variant={variant}>{label}</Badge>;
};

export const applicationColumns = (onChanged?: () => void): ColumnDef<Application>[] => [
    {
        header: '신청자',
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
        header: '예약일자',
        accessorKey: 'booked_date',
        cell: ({ getValue }) => {
            const v = String(getValue());
            const d = v.slice(0, 10).replaceAll('-', '.');
            return <span className='tabular-nums text-muted-foreground'>{d}</span>;
        },
    },
    {
        id: 'status',
        header: '상태',
        cell: ({ row }) => {
            const app = row.original;
            const currentStatus = app.application_status;

            const handleApprove = async () => {
                try {
                    await updateApplication(app.application_id, { application_status: 'approved' });
                    onChanged?.();
                } catch (error) {
                    console.error('승인 실패:', error);
                    alert('승인에 실패했습니다.');
                }
            };

            const handleReject = () => {
                if (window.openRejectionModal) {
                    window.openRejectionModal(app);
                } else {
                    // fallback: 기존 방식
                    if (confirm('정말로 이 예약을 거절하시겠습니까?')) {
                        updateApplication(app.application_id, {
                            application_status: 'rejected',
                            rejection_reason: '관리자 처리',
                        })
                            .then(() => {
                                onChanged?.();
                            })
                            .catch((error) => {
                                console.error('거절 실패:', error);
                                alert('거절에 실패했습니다.');
                            });
                    }
                }
            };

            if (currentStatus === 'pending') {
                return (
                    <div className='flex gap-2'>
                        <Button
                            size='sm'
                            onClick={handleApprove}
                            className='bg-green-600 hover:bg-green-700'
                        >
                            승인
                        </Button>
                        <Button size='sm' variant='destructive' onClick={handleReject}>
                            거절
                        </Button>
                    </div>
                );
            }

            return statusBadge(currentStatus);
        },
    },
];
