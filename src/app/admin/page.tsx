'use client';

import * as React from 'react';
import { DataTable } from './components/data-table';
import { applicationColumns } from './components/reservation-columns';
import {
    fetchApplications,
    type Application,
    type ApplicationsResponse,
} from './_apis/mentoring-application-api';

const DEFAULT_LIMIT = 10;
// TODO: 실제 로그인 사용자(멘토/관리자)의 user_idx로 치환
const ADMIN_USER_IDX = 1;

export default function AdminPage() {
    const [data, setData] = React.useState<Application[]>([]);
    const [pageInfo, setPageInfo] = React.useState<{
        page: number;
        limit: number;
        total_pages: number;
        has_next: boolean;
    }>({
        page: 1,
        limit: DEFAULT_LIMIT,
        total_pages: 1,
        has_next: false,
    });
    const [loading, setLoading] = React.useState(true);

    const load = React.useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await fetchApplications(ADMIN_USER_IDX, p, DEFAULT_LIMIT);
            setData(res.applications);
            setPageInfo({
                page: res.page_info.page,
                limit: res.page_info.limit,
                total_pages: Math.ceil(res.page_info.total / res.page_info.limit),
                has_next: res.page_info.has_next,
            });
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
        <div className='p-6'>
            <h1 className='text-xl font-semibold mb-4'>멘토링 상품 관리</h1>
            {loading ? (
                <div className='text-sm text-muted-foreground'>불러오는 중…</div>
            ) : (
                <DataTable
                    columns={applicationColumns()} // 인수 제거
                    data={data}
                    pageInfo={pageInfo}
                    onPageChange={(p) => load(p)}
                />
            )}
        </div>
    );
}
