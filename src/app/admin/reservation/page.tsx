'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { DataTable } from '../components/data-table';
import { applicationColumns } from '../components/reservation-columns';
import {
    fetchApplications,
    type Application,
    type ApplicationsResponse,
} from '../_apis/mentoring-application-api';

const DEFAULT_LIMIT = 10;
// TODO: 실제 로그인 사용자(멘토/관리자)의 user_idx로 치환
const ADMIN_USER_IDX = 1;

// 거절 사유 입력 모달 컴포넌트
const RejectionModal = ({
    isOpen,
    onClose,
    onConfirm,
    menteeName,
    productTitle,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    menteeName: string;
    productTitle: string;
}) => {
    const [reason, setReason] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim()) {
            onConfirm(reason.trim());
            setReason('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
                <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold'>예약 거절 사유</h3>
                    <Button variant='ghost' size='sm' onClick={onClose} className='h-8 w-8 p-0'>
                        <X className='h-4 w-4' />
                    </Button>
                </div>

                <p className='text-sm text-muted-foreground mb-4'>
                    <span className='font-medium'>{menteeName}</span>님의 "{productTitle}" 예약을
                    거절하는 사유를 입력해주세요.
                </p>

                <form onSubmit={handleSubmit}>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder='거절 사유를 입력하세요...'
                        className='w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
                        required
                    />

                    <div className='flex justify-end gap-2 mt-4'>
                        <Button type='button' variant='outline' onClick={onClose}>
                            취소
                        </Button>
                        <Button type='submit' variant='destructive' disabled={!reason.trim()}>
                            거절
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function AdminPage() {
    const [data, setData] = React.useState<Application[]>([]);
    const [pageInfo, setPageInfo] = React.useState<ApplicationsResponse['page_info']>({
        page: 1,
        limit: DEFAULT_LIMIT,
        total: 0,
        has_next: false,
    });
    const [loading, setLoading] = React.useState(true);
    const [rejectionModal, setRejectionModal] = React.useState<{
        isOpen: boolean;
        application: Application | null;
    }>({
        isOpen: false,
        application: null,
    });

    const load = React.useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await fetchApplications(ADMIN_USER_IDX, p, DEFAULT_LIMIT);
            setData(res.applications);
            setPageInfo(res.page_info);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRejectionClick = React.useCallback((application: Application) => {
        setRejectionModal({
            isOpen: true,
            application,
        });
    }, []);

    const handleRejectionConfirm = React.useCallback(
        async (reason: string) => {
            if (rejectionModal.application) {
                try {
                    const { updateApplication } = await import(
                        '../_apis/mentoring-application-api'
                    );
                    await updateApplication(rejectionModal.application.application_id, {
                        application_status: 'rejected',
                        rejection_reason: reason,
                    });
                    load(pageInfo.page);
                    setRejectionModal({
                        isOpen: false,
                        application: null,
                    });
                } catch (error) {
                    console.error('거절 실패:', error);
                    alert('거절에 실패했습니다.');
                }
            }
        },
        [rejectionModal.application, load, pageInfo.page],
    );

    const handleRejectionClose = React.useCallback(() => {
        setRejectionModal({
            isOpen: false,
            application: null,
        });
    }, []);

    React.useEffect(() => {
        load(1);
    }, [load]);

    // window 객체에 모달 열기 함수 등록
    React.useEffect(() => {
        window.openRejectionModal = handleRejectionClick;
        return () => {
            window.openRejectionModal = undefined;
        };
    }, [handleRejectionClick]);

    return (
        <>
            <div className='p-8 space-y-8'>
                {/* 헤더 섹션 */}
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold'>예약 관리</h1>
                        <p className='text-muted-foreground mt-2'>
                            멘토링 예약 신청을 확인하고 관리할 수 있습니다.
                        </p>
                    </div>
                </div>

                {/* 데이터 테이블 섹션 */}
                <div className='rounded-lg border'>
                    {loading ? (
                        <div className='flex items-center justify-center h-32'>
                            <div className='text-sm text-muted-foreground'>불러오는 중…</div>
                        </div>
                    ) : (
                        <DataTable
                            columns={applicationColumns(() => load(pageInfo.page))}
                            data={data}
                            pageInfo={pageInfo}
                            onPageChange={(p) => load(p)}
                        />
                    )}
                </div>
            </div>

            {/* 거절 사유 입력 모달 */}
            <RejectionModal
                isOpen={rejectionModal.isOpen}
                onClose={handleRejectionClose}
                onConfirm={handleRejectionConfirm}
                menteeName={rejectionModal.application?.mentee.name || ''}
                productTitle={rejectionModal.application?.product_title || ''}
            />
        </>
    );
}
