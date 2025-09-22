'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        // 에러 로깅 (선택사항)
        console.error('Global error boundary caught an error:', error);
    }, [error]);

    return (
        <html>
            <body>
                <div className='min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center p-4'>
                    <div className='w-full max-w-md'>
                        <Card className='shadow-2xl border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm'>
                            <CardHeader className='text-center space-y-4 pb-8'>
                                <div className='mx-auto w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-4'>
                                    <AlertTriangle className='w-12 h-12 text-white' />
                                </div>
                                <CardTitle className='text-4xl font-bold text-slate-900 dark:text-white'>
                                    심각한 오류 발생
                                </CardTitle>
                                <CardDescription className='text-lg text-slate-600 dark:text-slate-300'>
                                    예상치 못한 심각한 문제가 발생했습니다
                                </CardDescription>
                                <p className='text-sm text-slate-500 dark:text-slate-400'>
                                    애플리케이션을 다시 시작하거나, 문제가 지속되면 고객지원팀에
                                    문의해주세요.
                                </p>
                            </CardHeader>

                            <CardContent className='space-y-6'>
                                <div className='flex flex-col sm:flex-row gap-3'>
                                    <Button
                                        onClick={reset}
                                        className='flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-lg'
                                    >
                                        <RefreshCw className='w-4 h-4 mr-2' />
                                        애플리케이션 재시작
                                    </Button>

                                    <Button
                                        asChild
                                        variant='outline'
                                        className='flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    >
                                        <Link
                                            prefetch={true}
                                            href='/'
                                            className='flex items-center justify-center gap-2'
                                        >
                                            <Home className='w-4 h-4' />
                                            홈으로 돌아가기
                                        </Link>
                                    </Button>
                                </div>

                                <div className='flex flex-col sm:flex-row gap-3'>
                                    <Button
                                        variant='outline'
                                        className='flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        onClick={() => window.location.reload()}
                                    >
                                        <RefreshCw className='w-4 h-4 mr-2' />
                                        페이지 새로고침
                                    </Button>
                                </div>

                                <div className='text-center'>
                                    <p className='text-xs text-slate-400 dark:text-slate-500'>
                                        에러 코드: {error.digest || 'GLOBAL_ERROR'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 추가적인 시각적 요소 */}
                        <div className='mt-8 text-center'>
                            <div className='inline-flex space-x-1'>
                                <div className='w-2 h-2 bg-red-500 rounded-full animate-bounce'></div>
                                <div
                                    className='w-2 h-2 bg-orange-500 rounded-full animate-bounce'
                                    style={{ animationDelay: '0.1s' }}
                                ></div>
                                <div
                                    className='w-2 h-2 bg-yellow-500 rounded-full animate-bounce'
                                    style={{ animationDelay: '0.2s' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
