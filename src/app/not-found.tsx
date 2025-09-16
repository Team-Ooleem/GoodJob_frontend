'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4'>
            <div className='w-full max-w-md'>
                <Card className='shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm'>
                    <CardHeader className='text-center space-y-4 pb-8'>
                        <div className='mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4'>
                            <Search className='w-12 h-12 text-white' />
                        </div>
                        <CardTitle className='text-4xl font-bold text-slate-900 dark:text-white'>
                            404
                        </CardTitle>
                        <CardDescription className='text-lg text-slate-600 dark:text-slate-300'>
                            페이지를 찾을 수 없습니다
                        </CardDescription>
                        <p className='text-sm text-slate-500 dark:text-slate-400'>
                            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
                        </p>
                    </CardHeader>

                    <CardContent className='space-y-6'>
                        <div className='flex flex-col sm:flex-row gap-3'>
                            <Button
                                asChild
                                className='flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
                            >
                                <Link href='/' className='flex items-center justify-center gap-2'>
                                    <Home className='w-4 h-4' />
                                    홈으로 돌아가기
                                </Link>
                            </Button>

                            <Button
                                variant='outline'
                                className='flex-1 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft className='w-4 h-4 mr-2' />
                                이전 페이지
                            </Button>
                        </div>

                        <div className='text-center'>
                            <p className='text-xs text-slate-400 dark:text-slate-500'>
                                문제가 지속되면 고객지원팀에 문의해주세요
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 추가적인 시각적 요소 */}
                <div className='mt-8 text-center'>
                    <div className='inline-flex space-x-1'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full animate-bounce'></div>
                        <div
                            className='w-2 h-2 bg-purple-500 rounded-full animate-bounce'
                            style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                            className='w-2 h-2 bg-pink-500 rounded-full animate-bounce'
                            style={{ animationDelay: '0.2s' }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
