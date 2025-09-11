'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MessageCircle,
    Users,
    TrendingUp,
    BookOpen,
    Star,
    Heart,
    Lightbulb,
    Target,
} from 'lucide-react';

export default function MentoringMainContent() {
    return (
        <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-["Pretendard"]'>
            {/* Background decorative elements */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                <div className='absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl'></div>
                <div className='absolute top-1/2 -left-40 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl'></div>
                <div className='absolute -bottom-40 right-1/3 w-64 h-64 bg-cyan-200/25 rounded-full blur-3xl'></div>
            </div>

            {/* Hero Section */}
            <section className='relative px-4 py-20 lg:py-32'>
                <div className='max-w-6xl mx-auto'>
                    <div className='grid lg:grid-cols-2 gap-12 items-center'>
                        {/* Left Content */}
                        <div className='space-y-8'>
                            <div className='space-y-4'>
                                <Badge
                                    variant='secondary'
                                    className='bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-2 text-sm font-medium'
                                >
                                    멘토링
                                </Badge>

                                <h1 className='text-4xl lg:text-6xl font-semibold text-gray-900 leading-tight tracking-tight'>
                                    <span className='relative'>
                                        가장 쉽게 지식을
                                        <span className='absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-emerald-200 to-teal-200 rounded-full opacity-60'></span>
                                    </span>
                                    <br />
                                    <span className='relative'>
                                        공유하는 방법
                                        <Star className='absolute -top-2 -right-8 w-6 h-6 text-yellow-400 fill-yellow-400' />
                                    </span>
                                </h1>
                            </div>

                            <div className='space-y-4 text-lg text-gray-700 leading-relaxed font-normal'>
                                <p>나누고 싶은 지식이 있는 누구나 멘토가 될 수 있어요!</p>
                                <p>업계 후배들 혹은 동료들이</p>
                                <p>더 빨리, 더 멀리 갈 수 있도록 도와주세요!</p>
                            </div>

                            <Button
                                size='lg'
                                className='bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-10 py-5 text-xl font-medium rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105'
                            >
                                <MessageCircle className='w-6 h-6 mr-3' />
                                멘토 지원하기
                            </Button>
                        </div>

                        {/* Right Illustration */}
                        <div className='relative'>
                            <div className='bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20'>
                                <div className='space-y-6'>
                                    {/* Desk */}
                                    <div className='bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl h-32 relative'>
                                        {/* Laptop */}
                                        <div className='absolute top-4 left-8 w-24 h-16 bg-white rounded-lg shadow-lg'>
                                            <div className='w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center'>
                                                <TrendingUp className='w-8 h-8 text-emerald-600' />
                                            </div>
                                        </div>

                                        {/* Plant */}
                                        <div className='absolute top-2 right-12 w-6 h-8 bg-purple-200 rounded-full flex items-end justify-center'>
                                            <div className='w-4 h-4 bg-red-300 rounded-full mb-1'></div>
                                        </div>

                                        {/* Documents */}
                                        <div className='absolute bottom-2 right-8 w-8 h-6 bg-gray-200 rounded'></div>
                                        <div className='absolute bottom-2 right-16 w-6 h-6 bg-emerald-200 rounded'></div>
                                    </div>

                                    {/* Chair */}
                                    <div className='bg-gradient-to-r from-emerald-200 to-teal-200 rounded-lg h-8 w-16 mx-auto'></div>

                                    {/* Storage */}
                                    <div className='bg-gradient-to-r from-emerald-200 to-teal-200 rounded-lg h-12 w-20 mx-auto flex space-x-1 p-1'>
                                        <div className='w-2 h-10 bg-emerald-300 rounded'></div>
                                        <div className='w-2 h-10 bg-emerald-300 rounded'></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className='relative px-4 py-20 bg-gradient-to-b from-white/30 to-white/60 backdrop-blur-sm'>
                <div className='max-w-6xl mx-auto'>
                    <div className='text-center space-y-6 mb-20'>
                        <div className='inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full text-sm font-medium'>
                            <Star className='w-4 h-4' />
                            <span>멘토링의 특별한 가치</span>
                        </div>
                        <h2 className='text-3xl lg:text-5xl font-semibold text-gray-900 leading-tight'>
                            왜 멘토링을 선택해야 할까요?
                        </h2>
                        <p className='text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed'>
                            강의 제작의 복잡함 없이, 바로 시작할 수 있는 가장 자연스러운 지식 공유
                            방법입니다
                        </p>
                    </div>

                    <div className='mb-16'>
                        {/* Main Feature */}
                        <div>
                            <div className='bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-10 text-white relative overflow-hidden'>
                                <div className='absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16'></div>
                                <div className='absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12'></div>
                                <div className='relative z-10'>
                                    <div className='flex items-center space-x-3 mb-6'>
                                        <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center'>
                                            <MessageCircle className='w-6 h-6' />
                                        </div>
                                        <h3 className='text-2xl font-semibold'>
                                            간단한 1:1 대화로 시작
                                        </h3>
                                    </div>
                                    <p className='text-lg text-white/90 leading-relaxed mb-6'>
                                        복잡한 강의 제작 과정 없이, 당신의 경험과 노하우를 직접
                                        전달하세요. 실시간 피드백과 질문을 통해 더 효과적인 학습을
                                        제공할 수 있습니다.
                                    </p>
                                    <div className='flex items-center space-x-4 text-sm'>
                                        <div className='flex items-center space-x-2'>
                                            <div className='w-2 h-2 bg-white/60 rounded-full'></div>
                                            <span>즉시 시작 가능</span>
                                        </div>
                                        <div className='flex items-center space-x-2'>
                                            <div className='w-2 h-2 bg-white/60 rounded-full'></div>
                                            <span>개인 맞춤형 조언</span>
                                        </div>
                                        <div className='flex items-center space-x-2'>
                                            <div className='w-2 h-2 bg-white/60 rounded-full'></div>
                                            <span>실시간 소통</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Benefits */}
                    <div className='grid md:grid-cols-2 gap-8'>
                        <div className='bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-lg'>
                            <div className='flex items-start space-x-4'>
                                <div className='w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center flex-shrink-0'>
                                    <BookOpen className='w-7 h-7 text-pink-600' />
                                </div>
                                <div>
                                    <h4 className='text-xl font-semibold text-gray-900 mb-3'>
                                        전문성 강화
                                    </h4>
                                    <p className='text-gray-600 leading-relaxed'>
                                        지식을 설명하고 전달하는 과정에서 본인의 이해도가 더욱
                                        깊어집니다. 멘토링을 통해 당신도 함께 성장할 수 있어요.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-lg'>
                            <div className='flex items-start space-x-4'>
                                <div className='w-14 h-14 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center flex-shrink-0'>
                                    <Heart className='w-7 h-7 text-cyan-600' />
                                </div>
                                <div>
                                    <h4 className='text-xl font-semibold text-gray-900 mb-3'>
                                        선한 영향력
                                    </h4>
                                    <p className='text-gray-600 leading-relaxed'>
                                        당신의 경험과 지식이 누군가의 커리어에 큰 변화를 만들어낼 수
                                        있습니다. 멘토링을 통해 선한 마음을 전파해보세요.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className='relative px-4 py-20'>
                <div className='max-w-5xl mx-auto text-center'>
                    <div className='bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-16 text-white relative overflow-hidden'>
                        <div className='absolute inset-0 bg-white/10 rounded-3xl'></div>
                        <div className='absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-20'></div>
                        <div className='absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16'></div>
                        <div className='relative z-10 space-y-8'>
                            <div className='flex justify-center'>
                                <div className='w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center'>
                                    <Heart className='w-10 h-10 text-white' />
                                </div>
                            </div>
                            <h2 className='text-4xl lg:text-5xl font-semibold leading-tight'>
                                선한 마음을 퍼뜨려보세요
                            </h2>
                            <p className='text-xl text-white/90 max-w-3xl mx-auto leading-relaxed'>
                                당신의 지식과 경험이 누군가에게는 큰 도움이 될 수 있습니다. 멘토링을
                                통해 지식을 나누고, 함께 성장해보세요.
                            </p>
                            <div className='pt-4'>
                                <Button
                                    size='lg'
                                    className='bg-white text-emerald-600 hover:bg-gray-50 px-12 py-6 text-2xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1'
                                >
                                    <Lightbulb className='w-7 h-7 mr-3' />
                                    멘토 지원하기
                                </Button>
                            </div>
                            <p className='text-sm text-white/70 mt-4'>
                                지금 바로 시작하세요 • 무료 가입 • 언제든 중단 가능
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
