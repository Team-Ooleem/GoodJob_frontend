'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from '../components/data-table';
import { productColumns } from '../components/product-columns';
import {
    fetchMentoringProducts,
    type MentoringProduct,
    type MentoringProductsResponse,
} from '../_apis/mentoring-product-api';
import { fetchMyMentorIdx } from '../_apis/mentoring-application-api';
import { useAuth } from '@/hooks/use-auth';

const DEFAULT_LIMIT = 10;

export default function AdminProductPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [mentorIdx, setMentorIdx] = React.useState<number | null>(null);
    const [isMentor, setIsMentor] = React.useState<boolean>(false);
    const [mentorLoading, setMentorLoading] = React.useState(true);
    const [data, setData] = React.useState<MentoringProduct[]>([]);
    const [pageInfo, setPageInfo] = React.useState<MentoringProductsResponse['page_info']>({
        page: 1,
        limit: DEFAULT_LIMIT,
        total: 0,
        total_pages: 0,
        has_next: false,
    });
    const [loading, setLoading] = React.useState(true);

    // 멘토 ID 조회
    const loadMentorIdx = React.useCallback(async () => {
        if (!user?.idx) return;

        setMentorLoading(true);
        try {
            console.log('🔍 현재 사용자의 멘토 ID 조회 시작');
            const mentorData = await fetchMyMentorIdx();
            console.log('✅ 멘토 ID 조회 결과:', mentorData);
            setMentorIdx(mentorData.mentor_idx);
            setIsMentor(mentorData.is_mentor);
        } catch (e) {
            console.error('❌ 멘토 ID 조회 실패:', e);
            setMentorIdx(null);
            setIsMentor(false);
        } finally {
            setMentorLoading(false);
        }
    }, [user?.idx]);

    const load = React.useCallback(
        async (p: number) => {
            if (!mentorIdx) {
                console.warn('멘토 ID가 없어서 멘토링 상품을 불러올 수 없습니다.');
                return;
            }

            setLoading(true);
            try {
                console.log('멘토 ID로 멘토링 상품 조회:', { mentor_idx: mentorIdx });
                const res = await fetchMentoringProducts(p, DEFAULT_LIMIT, mentorIdx);
                setData(res.products);
                setPageInfo(res.page_info);
            } catch (e) {
                console.error('멘토링 상품 조회 실패:', e);
            } finally {
                setLoading(false);
            }
        },
        [mentorIdx],
    );

    // 사용자 정보 로드 후 멘토 ID 조회
    React.useEffect(() => {
        if (!authLoading && user?.idx) {
            loadMentorIdx();
        }
    }, [loadMentorIdx, authLoading, user?.idx]);

    // 멘토 ID 로드 후 상품 목록 조회
    React.useEffect(() => {
        if (!mentorLoading && mentorIdx) {
            load(1);
        }
    }, [load, mentorLoading, mentorIdx]);

    // 인증 로딩 중이거나 사용자 정보가 없는 경우
    if (authLoading) {
        return (
            <div className='p-8 space-y-8'>
                <div className='flex items-center justify-center h-32'>
                    <div className='text-sm text-muted-foreground'>사용자 정보를 불러오는 중…</div>
                </div>
            </div>
        );
    }

    if (!user?.idx) {
        return (
            <div className='p-8 space-y-8'>
                <div className='flex items-center justify-center h-32'>
                    <div className='text-sm text-muted-foreground'>로그인이 필요합니다.</div>
                </div>
            </div>
        );
    }

    // 멘토 ID 로딩 중
    if (mentorLoading) {
        return (
            <div className='p-8 space-y-8'>
                <div className='flex items-center justify-center h-32'>
                    <div className='text-sm text-muted-foreground'>멘토 정보를 불러오는 중…</div>
                </div>
            </div>
        );
    }

    // 멘토가 아닌 경우
    if (!isMentor || !mentorIdx) {
        return (
            <div className='p-8 space-y-8'>
                <div className='flex items-center justify-center h-32'>
                    <div className='text-sm text-muted-foreground'>
                        멘토 권한이 없습니다. 멘토로 등록된 사용자만 상품을 관리할 수 있습니다.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='p-8 space-y-8'>
            {/* 헤더 섹션 */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-2xl font-bold'>멘토링 상품 관리</h1>
                    <p className='text-muted-foreground mt-2'>
                        멘토링 상품을 등록하고 관리할 수 있습니다.
                    </p>
                </div>
                <Link href='/admin/mentoring/creation'>
                    <Button className='flex items-center gap-2'>
                        <Plus className='h-4 w-4' />
                        멘토링 등록
                    </Button>
                </Link>
            </div>

            {/* 데이터 테이블 섹션 */}
            <div className='rounded-lg border'>
                {loading ? (
                    <div className='flex items-center justify-center h-32'>
                        <div className='text-sm text-muted-foreground'>불러오는 중…</div>
                    </div>
                ) : (
                    <DataTable
                        columns={productColumns(() => load(pageInfo.page))}
                        data={data}
                        pageInfo={pageInfo}
                        onPageChange={(p) => load(p)}
                    />
                )}
            </div>
        </div>
    );
}
