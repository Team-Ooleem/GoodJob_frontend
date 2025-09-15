'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MentoringProductList } from './_components/MentoringProductList';
import { useMentoringProducts } from './_hooks/useMentoringProducts';

export default function PlatformPage() {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
        useMentoringProducts();

    // 모든 페이지의 상품들을 하나의 배열로 합치기
    const allProducts = data?.pages?.flatMap((page) => page?.products || []) ?? [];

    if (isLoading) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-background dark:from-slate-900 dark:to-slate-800 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4'></div>
                    <p className='text-muted-foreground'>멘토링 상품을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-background dark:from-slate-900 dark:to-slate-800 flex items-center justify-center'>
                <div className='text-center'>
                    <p className='text-red-500 mb-4'>
                        멘토링 상품을 불러오는 중 오류가 발생했습니다.
                    </p>
                    <Button onClick={() => window.location.reload()}>다시 시도</Button>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-background dark:from-slate-900 dark:to-slate-800'>
            <div className='max-w-7xl pt-6 mx-auto'>
                <div className='flex'>
                    {/* 메인 콘텐츠 영역 */}
                    <div className='flex-1'>
                        {/* 메인 비주얼 섹션 */}
                        <section className='relative px-4 py-8 lg:py-12 overflow-hidden bg-gradient-to-br from-rose-50/80 via-sky-50/70 to-lavender-50/80 dark:from-slate-900/80 dark:via-sky-950/35 dark:to-lavender-950/40'>
                            {/* Soft Pastel Background */}
                            <div className='absolute inset-0'>
                                {/* Main soft gradient overlay */}
                                <div className='absolute inset-0 bg-gradient-to-br from-rose-100/30 via-sky-100/28 to-lavender-100/30 dark:from-rose-900/15 dark:via-sky-900/18 dark:to-lavender-900/18'></div>

                                {/* Soft floating orbs */}
                                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-200/40 dark:from-rose-300/20 via-transparent to-transparent'></div>
                                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-sky-200/38 dark:from-sky-300/19 via-transparent to-transparent'></div>
                                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-300/32 dark:from-sky-400/16 via-transparent to-transparent'></div>
                                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-lavender-200/30 dark:from-lavender-300/15 via-transparent to-transparent'></div>
                                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-sky-400/28 dark:from-sky-500/14 via-transparent to-transparent'></div>

                                {/* Subtle pattern overlay */}
                                <div
                                    className='absolute inset-0 opacity-[0.02] dark:opacity-[0.05]'
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f472b6' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                        backgroundSize: '60px 60px',
                                    }}
                                ></div>

                                {/* Soft diagonal lines */}
                                <div className='absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,rgba(251,207,232,0.08)_25%,transparent_50%,rgba(196,181,253,0.06)_75%,transparent_100%)] dark:bg-[linear-gradient(45deg,transparent_0%,rgba(251,207,232,0.15)_25%,transparent_50%,rgba(196,181,253,0.12)_75%,transparent_100%)]'></div>
                                <div className='absolute inset-0 bg-[linear-gradient(-45deg,transparent_0%,rgba(254,202,202,0.06)_25%,transparent_50%,rgba(165,243,252,0.05)_75%,transparent_100%)] dark:bg-[linear-gradient(-45deg,transparent_0%,rgba(254,202,202,0.12)_25%,transparent_50%,rgba(165,243,252,0.08)_75%,transparent_100%)]'></div>
                            </div>

                            <div className='relative max-w-4xl mx-auto'>
                                <div className='text-center space-y-8'>
                                    <div className='space-y-4'>
                                        <h1 className='text-2xl md:text-3xl font-bold text-foreground leading-relaxed'>
                                            당신의 경험을 나누고, 새로운 인사이트를 얻어보세요
                                            <br />
                                            <span className='bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600 dark:from-sky-400 dark:via-blue-400 dark:to-sky-500 bg-clip-text text-transparent'>
                                                함께 성장하는 취업 플랫폼
                                            </span>
                                        </h1>
                                    </div>

                                    <div className='flex flex-col sm:flex-row gap-3 justify-center items-center mt-8'>
                                        <Link href='/mentoring'>
                                            <Button className='flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600 dark:from-sky-600 dark:via-blue-600 dark:to-sky-700 hover:from-sky-600 hover:via-blue-600 hover:to-sky-700 dark:hover:from-sky-700 dark:hover:via-blue-700 dark:hover:to-sky-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300'>
                                                멘토 지원하기
                                            </Button>
                                        </Link>
                                        <Link href='/ai-interview' target='_blank'>
                                            <Button
                                                variant='outline'
                                                className='flex items-center gap-2 px-6 py-3 border-sky-300 dark:border-sky-600 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300'
                                            >
                                                AI 면접 체험
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 멘토링 카드 섹션 */}
                        <section className='py-16'>
                            <div className='container'>
                                <MentoringProductList
                                    products={allProducts}
                                    hasNextPage={hasNextPage}
                                    isFetchingNextPage={isFetchingNextPage}
                                    onLoadMore={() => fetchNextPage()}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
