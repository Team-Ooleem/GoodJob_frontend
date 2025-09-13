'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    MessageCircle,
    Users,
    Mic,
    Save,
    ArrowRight,
    CheckCircle,
    Heart,
    Lightbulb,
    PenTool,
} from 'lucide-react';
import MentorApplicationModal from './MentorApplicationModal';

export default function MentoringMainContent() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-background to-muted font-["Inter",system-ui,-apple-system,sans-serif]'>
            {/* Hero Section */}
            <section className='relative px-4 py-20 lg:py-32 overflow-hidden'>
                {/* Sky-Blue Gradient Background */}
                <div className='absolute inset-0 bg-gradient-to-br '>
                    {/* Animated gradient layers */}
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-200/70 via-transparent to-transparent animate-pulse'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-200/60 via-transparent to-transparent animate-pulse delay-1000'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-300/50 via-transparent to-transparent animate-pulse delay-2000'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-200/45 via-transparent to-transparent animate-pulse delay-500'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-300/40 via-transparent to-transparent animate-pulse delay-1500'></div>

                    {/* Additional animated overlays */}
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,_var(--tw-gradient-stops))] from-sky-200/35 via-transparent to-transparent animate-pulse delay-750'></div>
                    <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center_bottom,_var(--tw-gradient-stops))] from-blue-200/30 via-transparent to-transparent animate-pulse delay-1250'></div>

                    {/* Floating Sky Elements */}
                    <div className='absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-sky-200/40 to-blue-200/30 rounded-full blur-2xl animate-bounce'></div>
                    <div className='absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-blue-200/35 to-sky-200/25 rounded-full blur-3xl animate-bounce delay-1000'></div>
                    <div className='absolute bottom-20 left-1/4 w-36 h-36 bg-gradient-to-br from-cyan-200/40 to-sky-200/30 rounded-full blur-2xl animate-bounce delay-2000'></div>
                    <div className='absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-sky-300/45 to-blue-300/35 rounded-full blur-xl animate-bounce delay-500'></div>
                    <div className='absolute bottom-1/3 right-1/4 w-44 h-44 bg-gradient-to-br from-blue-200/30 to-cyan-200/25 rounded-full blur-2xl animate-bounce delay-1500'></div>
                    <div className='absolute top-1/4 left-1/2 w-20 h-20 bg-gradient-to-br from-sky-200/50 to-blue-200/40 rounded-full blur-lg animate-bounce delay-3000'></div>
                    <div className='absolute bottom-1/4 left-1/6 w-28 h-28 bg-gradient-to-br from-cyan-200/35 to-sky-200/30 rounded-full blur-xl animate-bounce delay-2500'></div>

                    {/* Dynamic Sky Shapes */}
                    <div className='absolute top-1/3 right-10 w-48 h-32 bg-gradient-to-r from-sky-200/25 to-blue-200/20 rounded-3xl blur-xl animate-pulse delay-750'></div>
                    <div className='absolute bottom-1/2 left-1/3 w-40 h-48 bg-gradient-to-b from-blue-200/25 to-sky-200/20 rounded-3xl blur-xl animate-pulse delay-1750'></div>
                    <div className='absolute top-1/6 left-1/4 w-36 h-40 bg-gradient-to-br from-cyan-200/30 to-blue-200/25 rounded-2xl blur-lg animate-pulse delay-1250'></div>

                    {/* Animated Cloud Effects */}
                    <div className='absolute top-1/4 right-1/4 w-60 h-20 bg-gradient-to-r from-white/20 to-sky-100/30 rounded-full blur-lg animate-pulse delay-500'></div>
                    <div className='absolute bottom-1/3 left-1/5 w-80 h-16 bg-gradient-to-r from-sky-100/25 to-white/15 rounded-full blur-lg animate-pulse delay-1000'></div>
                    <div className='absolute top-1/2 left-1/3 w-40 h-12 bg-gradient-to-r from-cyan-100/30 to-sky-100/20 rounded-full blur-md animate-pulse delay-2000'></div>

                    {/* Floating Particles */}
                    <div className='absolute top-1/5 left-1/6 w-2 h-2 bg-sky-400/60 rounded-full animate-ping delay-1000'></div>
                    <div className='absolute top-1/3 right-1/5 w-1 h-1 bg-blue-400/70 rounded-full animate-ping delay-2000'></div>
                    <div className='absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-cyan-400/50 rounded-full animate-ping delay-3000'></div>
                    <div className='absolute top-2/3 right-1/3 w-1 h-1 bg-sky-500/60 rounded-full animate-ping delay-1500'></div>
                    <div className='absolute bottom-1/5 right-1/6 w-2 h-2 bg-blue-500/50 rounded-full animate-ping delay-2500'></div>
                </div>

                <div className='relative max-w-7xl mx-auto'>
                    <div className='text-center space-y-10'>
                        {/* Badge */}
                        <div className='inline-flex items-center space-x-3 bg-card/80 backdrop-blur-sm text-sky-600 px-6 py-3 rounded-full text-sm font-semibold shadow-lg border border-border'>
                            <MessageCircle className='w-5 h-5' />
                            <span>멘토링</span>
                        </div>

                        {/* Main Headline */}
                        <div className='space-y-8'>
                            <h1 className='text-5xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight'>
                                당신의 작은 이야기가
                                <br />
                                <span className='bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600 bg-clip-text text-transparent'>
                                    누군가의 큰 변화가 돼요
                                </span>
                            </h1>

                            <div className='space-y-6 text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed'>
                                <p className='font-semibold text-2xl text-foreground'>
                                    "이런 걸 어떻게 알려드리지?"
                                </p>
                                <p className='text-lg text-muted-foreground leading-relaxed'>
                                    그 고민이 시작이에요. 당신이 겪은 실패와 성공, 그 모든 순간들이
                                    <br />
                                    <span className='font-medium text-sky-600'>
                                        지금 막 같은 길을 걷고 있는 누군가에게는 소중한 나침반
                                    </span>
                                    이 될 거예요.
                                </p>
                                <p className='text-base text-muted-foreground/70 italic'>
                                    "내가 도움이 될까?" 그 마음만으로도 충분해요.
                                </p>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className='pt-12'>
                            <Button
                                size='lg'
                                onClick={handleOpenModal}
                                className='group relative bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600 hover:from-sky-600 hover:via-blue-600 hover:to-sky-700 text-white px-16 py-8 text-2xl font-bold rounded-3xl shadow-2xl hover:shadow-4xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 overflow-hidden'
                            >
                                {/* Animated background gradient */}
                                <div className='absolute inset-0 bg-gradient-to-r from-sky-400 via-blue-400 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

                                {/* Button content */}
                                <span className='relative flex items-center space-x-4 z-10'>
                                    <span className='text-2xl font-black tracking-wide'>
                                        멘토링 시작하기
                                    </span>
                                    <ArrowRight className='w-7 h-7 group-hover:translate-x-2 transition-transform duration-300' />
                                </span>

                                {/* Shine effect */}
                                <div className='absolute inset-0 -top-2 -left-2 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000'></div>
                            </Button>
                            <p className='mt-6 text-base text-muted-foreground font-semibold'>
                                ✨ 무료로 시작 • 언제든 중단 가능 • 5분이면 준비 완료
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className='py-20 bg-gradient-to-br from-sky-50 via-blue-50 to-sky-100'>
                <div className='max-w-7xl mx-auto px-4'>
                    <div className='text-center space-y-6 mb-16'>
                        <h2 className='text-4xl lg:text-5xl font-extrabold text-foreground leading-tight tracking-tight'>
                            그냥 말해보세요, 그게 시작이에요
                        </h2>
                        <p className='text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium'>
                            강의처럼 무겁지 않아요. 가볍게 대화하면서 지식을 나눌 수 있어요.
                        </p>
                    </div>

                    {/* Main Feature Card */}
                    <div className='mb-16'>
                        <Card className='bg-gradient-to-br from-sky-400 to-blue-500 text-white border-0 shadow-2xl hover:shadow-3xl transition-shadow duration-300'>
                            <CardContent className='p-12'>
                                <div className='grid lg:grid-cols-2 gap-12 items-center'>
                                    <div className='space-y-6'>
                                        <div className='flex items-center space-x-3'>
                                            <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center'>
                                                <MessageCircle className='w-6 h-6' />
                                            </div>
                                            <h3 className='text-2xl font-bold'>
                                                지식을 나누는 가장 쉬운 방법
                                            </h3>
                                        </div>

                                        <p className='text-lg text-white/90 leading-relaxed'>
                                            따로 준비할 것도 없어요. 음성으로, 그림으로, 있는 그대로
                                            전할 수 있어요. 서로 묻고 답하면서, 같이 성장해요.
                                        </p>

                                        <div className='space-y-3'>
                                            <div className='flex items-center space-x-3 text-white/90'>
                                                <CheckCircle className='w-5 h-5 text-green-300' />
                                                <span>실시간 음성채널로 편하게 이야기해요</span>
                                            </div>
                                            <div className='flex items-center space-x-3 text-white/90'>
                                                <CheckCircle className='w-5 h-5 text-green-300' />
                                                <span>말로 설명하면서 그림도 그릴 수 있어요</span>
                                            </div>
                                            <div className='flex items-center space-x-3 text-white/90'>
                                                <CheckCircle className='w-5 h-5 text-green-300' />
                                                <span>
                                                    대화는 저장돼요. 나중에 다시 볼 수 있어요
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Feature Icons */}
                                    <div className='grid grid-cols-2 gap-6'>
                                        <div className='bg-white/10 rounded-2xl p-6 text-center'>
                                            <Mic className='w-12 h-12 mx-auto mb-3 text-sky-200' />
                                            <p className='text-sm font-medium'>음성으로 설명</p>
                                        </div>
                                        <div className='bg-white/10 rounded-2xl p-6 text-center'>
                                            <PenTool className='w-12 h-12 mx-auto mb-3 text-sky-200' />
                                            <p className='text-sm font-medium'>그림으로 설명</p>
                                        </div>
                                        <div className='bg-white/10 rounded-2xl p-6 text-center'>
                                            <Save className='w-12 h-12 mx-auto mb-3 text-sky-200' />
                                            <p className='text-sm font-medium'>자동 저장</p>
                                        </div>
                                        <div className='bg-white/10 rounded-2xl p-6 text-center'>
                                            <Users className='w-12 h-12 mx-auto mb-3 text-sky-200' />
                                            <p className='text-sm font-medium'>1:1 대화</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Benefits */}
                    <div className='grid md:grid-cols-2 gap-8'>
                        <Card className='border-0 shadow-xl hover:shadow-2xl transition-shadow duration-200 bg-card/90 backdrop-blur-sm'>
                            <CardContent className='p-8'>
                                <div className='flex items-start space-x-4'>
                                    <div className='w-14 h-14 bg-sky-100 dark:bg-sky-900 rounded-2xl flex items-center justify-center flex-shrink-0'>
                                        <Lightbulb className='w-7 h-7 text-sky-600 dark:text-sky-400' />
                                    </div>
                                    <div>
                                        <h4 className='text-lg font-semibold text-foreground mb-3'>
                                            내가 알고 있는 걸 정리하는 과정도 꽤 의미 있어요
                                        </h4>
                                        <p className='text-muted-foreground leading-relaxed'>
                                            서로 묻고 답하면서, 같이 성장해요. 지식을 설명하고
                                            전달하는 과정에서 본인의 이해도가 더욱 깊어집니다.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='border-0 shadow-xl hover:shadow-2xl transition-shadow duration-200 bg-card/90 backdrop-blur-sm'>
                            <CardContent className='p-8'>
                                <div className='flex items-start space-x-4'>
                                    <div className='w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center flex-shrink-0'>
                                        <Heart className='w-7 h-7 text-blue-600 dark:text-blue-400' />
                                    </div>
                                    <div>
                                        <h4 className='text-lg font-semibold text-foreground mb-3'>
                                            당신의 경험, 누군가는 정말 궁금해해요
                                        </h4>
                                        <p className='text-muted-foreground leading-relaxed'>
                                            마음만 있다면, 누구나 멘토가 될 수 있어요. 특별한 사람이
                                            아니어도 괜찮아요. 그냥, 조금 더 먼저 겪은 사람이라면
                                            돼요.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className='py-20 bg-gradient-to-br from-sky-400 to-blue-500'>
                <div className='max-w-5xl mx-auto text-center px-4'>
                    <div className='space-y-8'>
                        <div className='space-y-4'>
                            <h2 className='text-3xl lg:text-5xl font-bold text-white leading-tight'>
                                지금, 누군가가 당신을 기다리고 있어요
                            </h2>
                            <p className='text-lg text-white/90 max-w-3xl mx-auto leading-relaxed'>
                                "내가 겪었던 일들이, 도움이 될 수 있을까?" 그 생각이면 충분해요.
                                지금, 시작해보세요.
                            </p>
                        </div>

                        <div className='pt-8'>
                            <Button
                                size='lg'
                                onClick={handleOpenModal}
                                className='bg-white text-blue-600 hover:bg-gray-50 px-12 py-6 text-xl font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-105'
                            >
                                나의 경험, 나눠볼게요
                                <ArrowRight className='w-6 h-6 ml-3' />
                            </Button>
                        </div>

                        <p className='text-white/70 text-base'>
                            생각보다 훨씬 쉽게 시작할 수 있어요 • 무료 가입 • 언제든 중단 가능
                        </p>
                    </div>
                </div>
            </section>

            {/* 멘토 지원 모달 */}
            <MentorApplicationModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </div>
    );
}
