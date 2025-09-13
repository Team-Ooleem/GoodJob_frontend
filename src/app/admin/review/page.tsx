'use client';

import * as React from 'react';
import { DataTable } from '../components/data-table';
import { reviewColumns } from '../components/review-columns';
import {
    fetchMentoringReviews,
    type MentoringReview,
    type MentoringReviewsResponse,
} from '../_apis/mentoring-review-api';

const DEFAULT_LIMIT = 10;

export default function ReviewPage() {
    const [data, setData] = React.useState<MentoringReview[]>([]);
    const [pageInfo, setPageInfo] = React.useState<MentoringReviewsResponse['page_info']>({
        page: 1,
        limit: DEFAULT_LIMIT,
        total: 0,
        has_next: false,
    });
    const [loading, setLoading] = React.useState(true);

    const load = React.useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await fetchMentoringReviews(p, DEFAULT_LIMIT);
            setData(res.reviews);
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
                    <h1 className='text-2xl font-bold'>리뷰 관리</h1>
                    <p className='text-muted-foreground mt-2'>
                        멘토링 리뷰를 확인하고 관리할 수 있습니다.
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
                        columns={reviewColumns()}
                        data={data}
                        pageInfo={pageInfo}
                        onPageChange={(p) => load(p)}
                    />
                )}
            </div>
        </div>
    );
}
