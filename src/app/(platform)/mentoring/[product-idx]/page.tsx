'use client';

import { StarRating } from '@/components/mentoring';
import {
    ScrollToNavigator,
    Content,
    ReviewsSummary,
    ReviewItem,
    MarkdownContent,
} from '../_components';
import { useMentoringProduct } from '../_hooks/useMentoringProduct';
import { useMentoringProductReviews } from '../_hooks/useMentoringProductReviews';

type Props = { params: { 'product-idx': string } };

export default function ProductDetailPage({ params }: Props) {
    const productId = params['product-idx'];
    const { data: product, isLoading, error } = useMentoringProduct(productId);
    const {
        data: reviewsData,
        isLoading: isReviewsLoading,
        error: reviewsError,
    } = useMentoringProductReviews(productId, 10);

    if (isLoading || isReviewsLoading) {
        return (
            <div className='w-full px-8 py-12 bg-muted'>
                <div className='w-[1140px] mx-auto'>로딩 중...</div>
            </div>
        );
    }

    if (error || reviewsError) {
        return (
            <div className='w-full px-8 py-12 bg-muted'>
                <div className='w-[1140px] mx-auto text-red-500'>
                    오류: {(error || reviewsError)?.message}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className='w-full px-8 py-12 bg-muted'>
                <div className='w-[1140px] mx-auto flex justify-between'>
                    <div className='w-[700px] flex flex-col gap-3'>
                        <div className='flex flex-col gap-2'>
                            <p className='text-sm'>{product?.categoryName || '카테고리 미지정'}</p>
                            <h1 className='text-4xl font-semibold'>{product?.title || '상품명'}</h1>
                        </div>
                        <div className='flex justify-start items-center gap-3'>
                            <div className='flex items-center gap-2'>
                                <StarRating rating={product?.ratingAverage ?? 0} />
                                <p className='text-sm font-bold underline decoration-1'>
                                    ({(product?.ratingAverage ?? 0).toFixed(1)}) 리뷰
                                    {product?.reviewCount ?? 0}개
                                </p>
                            </div>
                            <p className='text-sm font-normal'>
                                멘티{' '}
                                <span className='font-bold'>{product?.menteeCount ?? 0}명</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <ScrollToNavigator />
            <Content product={product}>
                {product?.content && (
                    <div className='mt-6'>
                        <MarkdownContent source={product.content} />
                    </div>
                )}
                <ReviewsSummary
                    averageRating={reviewsData?.averageRating ?? product?.ratingAverage ?? 0}
                    reviewCount={reviewsData?.reviewCount ?? product?.reviewCount ?? 0}
                />
                <div className='mt-10 flex flex-col'>
                    {(reviewsData?.reviews ?? []).map((r) => (
                        <ReviewItem
                            key={r.reviewIdx}
                            menteeName={r.menteeName}
                            rating={r.rating}
                            content={r.reviewContent}
                            createdAt={r.createdAt}
                        />
                    ))}
                </div>
            </Content>
        </>
    );
}
