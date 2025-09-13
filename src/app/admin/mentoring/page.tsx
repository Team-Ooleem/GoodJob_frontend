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

const DEFAULT_LIMIT = 10;

export default function AdminProductPage() {
    const [data, setData] = React.useState<MentoringProduct[]>([]);
    const [pageInfo, setPageInfo] = React.useState<MentoringProductsResponse['page_info']>({
        page: 1,
        limit: DEFAULT_LIMIT,
        total: 0,
        has_next: false,
    });
    const [loading, setLoading] = React.useState(true);

    const load = React.useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await fetchMentoringProducts(p, DEFAULT_LIMIT);
            setData(res.products);
            setPageInfo(res.page_info);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load(1);
    }, [load]);

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
