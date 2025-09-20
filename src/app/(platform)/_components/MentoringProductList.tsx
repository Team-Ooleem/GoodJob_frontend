'use client';

import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { MentoringCard } from './MentoringCard';
import { MentoringProduct } from '../_apis/mentoring-product-api';

interface MentoringProductListProps {
    products: MentoringProduct[];
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
}

export const MentoringProductList = ({
    products,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
}: MentoringProductListProps) => {
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px',
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage && onLoadMore) {
            onLoadMore();
        }
    }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

    if (products?.length === 0) {
        return (
            <div className='text-center py-12'>
                <p className='text-muted-foreground'>멘토링 상품이 없습니다.</p>
            </div>
        );
    }

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch justify-items-center'>
            {products?.map((mentoring) => (
                <MentoringCard key={mentoring?.product_idx} mentoring={mentoring} />
            ))}

            {/* 무한스크롤 트리거 */}
            {hasNextPage && (
                <div ref={ref} className='col-span-full flex justify-center py-4'>
                    {isFetchingNextPage ? (
                        <div className='text-muted-foreground'>로딩 중...</div>
                    ) : (
                        <div className='text-muted-foreground'>더 많은 상품을 불러오는 중...</div>
                    )}
                </div>
            )}
        </div>
    );
};
