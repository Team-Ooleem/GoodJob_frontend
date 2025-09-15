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
    const map: Record<Application['application_status'], { label: string; className: string }> = {
        pending: {
            label: '대기',
            className:
                'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-medium px-3 py-1 rounded-full text-xs shadow-sm',
        },
        approved: {
            label: '승인',
            className:
                'bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full text-xs border border-gray-200',
        },
        rejected: {
            label: '거절',
            className:
                'bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full text-xs border border-gray-200',
        },
        completed: {
            label: '완료',
            className:
                'bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full text-xs border border-gray-200',
        },
        cancelled: {
            label: '취소',
            className:
                'bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full text-xs border border-gray-200',
        },
    };
    const { label, className } = map[s] ?? {
        label: s,
        className:
            'bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-full text-xs border border-gray-200',
    };
    return <span className={className}>{label}</span>;
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
                    <div className='flex gap-3'>
                        <Button
                            size='sm'
                            onClick={handleApprove}
                            className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-0 text-xs'
                        >
                            승인
                        </Button>
                        <Button
                            size='sm'
                            onClick={handleReject}
                            className='bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-0 text-xs'
                        >
                            거절
                        </Button>
                    </div>
                );
            }

            return statusBadge(currentStatus);
        },
    },
];
