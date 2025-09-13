'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Users,
    MessageCircle,
    Rocket,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Timer,
    Crown,
    Star,
    ShieldCheck,
    Target,
    PenTool,
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function MentoringLandingContent() {
    const [showAllServices, setShowAllServices] = useState(false);
    const { setTheme } = useTheme();

    const scrollToList = useCallback(() => {
        document.getElementById('coaching-list')?.scrollIntoView({ behavior: 'smooth' });
        // setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }, []);

    const loadMoreServices = useCallback(() => {
        setShowAllServices(true);
    }, []);

    return (
        <div className='min-h-screen bg-background'>
            {/* HERO */}
            <section className='relative overflow-hidden'>
                {/* <div className='absolute inset-0 bg-[radial-gradient(1000px_600px_at_80%_-10%,var(--chart-1)_0%,transparent_60%),radial-gradient(900px_500px_at_10%_-10%,var(--chart-2)_0%,transparent_55%)] opacity-40' /> */}
                <div className='max-w-7xl mx-auto px-4 pt-28 pb-20 lg:pt-40 lg:pb-36 relative'>
                    <div className='text-center space-y-8'>
                        <Badge
                            variant='outline'
                            className='mx-auto bg-input text-foreground border-white/20 backdrop-blur text-sm sm:text-base'
                        >
                            현직자 1:1 · 실시간 피드백 · 포트폴리오/자소서
                        </Badge>
                        <h1 className='text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]'>
                            <span className='text-2xl sm:text-4xl lg:text-5xl block mb-4'>
                                막막한 취업 준비, 이제 끝내세요
                            </span>
                            <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'>
                                현직자와 함께하는 이력서 코칭
                            </span>
                        </h1>
                        <p className='text-base sm:text-lg foreground max-w-3xl mx-auto'>
                            실시간으로 고도화하는 이력서/자소서 코칭.
                        </p>
                        <div className='flex justify-center pt-4'>
                            <Button
                                onClick={scrollToList}
                                size='lg'
                                className='group bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 rounded-2xl shadow-2xl hover:shadow-[0_20px_60px_rgba(37,99,235,0.35)] transition-all'
                            >
                                지금 신청하기
                                <ArrowRight className='ml-2 h-5 w-5 transition-transform group-hover:translate-x-1' />
                            </Button>
                        </div>
                        <div className='flex items-center justify-center gap-6 pt-6 foreground'>
                            <p className='flex items-center gap-2'>
                                <Star className='h-4 w-4 text-yellow-400' /> 평균 평점 4.9/5.0
                            </p>
                            <p className='flex items-center gap-2'>
                                <Timer className='h-4 w-4' /> 최대 24시간 이내 피드백
                            </p>
                            <p className='flex items-center gap-2'>
                                <ShieldCheck className='h-4 w-4' /> 안전한 결제/보호
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 구분선 추가 */}
            <div className='max-w-7xl mx-auto px-4 py-8'>
                <div className='h-px bg-gradient-to-r from-transparent via-border to-transparent'></div>
            </div>

            {/* IMPACT / GROWTH*/}
            <section className='relative overflow-hidden sidebar-primary'>
                {/* 배경 그라데이션 */}
                {/* <div
                    className='pointer-events-none absolute inset-0 opacity-40
                  bg-[radial-gradient(900px_500px_at_80%_-10%,#2563eb_0%,transparent_60%),
                      radial-gradient(900px_450px_at_10%_-20%,#0ea5e9_0%,transparent_65%)]'
                /> */}
                <div className='relative max-w-7xl mx-auto px-4 py-20'>
                    <div className='max-w-3xl'>
                        <h3 className='text-2xl md:text-3xl font-extrabold'>
                            설계가 바꾼 서류 통과율
                        </h3>
                        <p className='mt-3 foreground'>
                            단순 작성만으론 부족한 시대. 직무 적합도 중심의 문서 설계는 서류
                            통과율을 크게 끌어올립니다.
                        </p>
                    </div>

                    {/* 범례 */}
                    <div className='mt-8 flex items-center gap-6 text-sm'>
                        <div className='flex items-center gap-2'>
                            <span className='inline-block h-2 w-6 rounded bg-blue-500' /> 코칭 작성
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className='inline-block h-2 w-6 rounded bg-muted-foreground' />{' '}
                            일반 작성
                        </div>
                    </div>

                    {/* 차트 (SVG) */}
                    <div className='mt-6 rounded-2xl bg-card border border-border p-6'>
                        <div className='aspect-[16/7]'>
                            <svg viewBox='0 0 1200 500' className='w-full h-full'>
                                {/* grid */}
                                <g stroke='var(--border)' strokeWidth='1'>
                                    {[...Array(6)].map((_, i) => (
                                        <line
                                            key={i}
                                            x1='60'
                                            x2='1140'
                                            y1={80 + i * 70}
                                            y2={80 + i * 70}
                                        />
                                    ))}
                                </g>

                                {/* bars (설계 적용) */}
                                {[
                                    { x: 160, h: 140 },
                                    { x: 360, h: 210 },
                                    { x: 560, h: 270 },
                                    { x: 760, h: 320 },
                                    { x: 960, h: 360 },
                                ].map((b, i) => (
                                    <rect
                                        key={i}
                                        x={b.x - 30}
                                        y={420 - b.h}
                                        width='60'
                                        height={b.h}
                                        fill='url(#barGrad)'
                                        rx='10'
                                    />
                                ))}

                                {/* bars (일반) */}
                                {[
                                    { x: 220, h: 90 },
                                    { x: 420, h: 120 },
                                    { x: 620, h: 140 },
                                    { x: 820, h: 155 },
                                    { x: 1020, h: 170 },
                                ].map((b, i) => (
                                    <rect
                                        key={i}
                                        x={b.x - 18}
                                        y={420 - b.h}
                                        width='36'
                                        height={b.h}
                                        fill='oklch(0.556 0 0)'
                                        rx='8'
                                    />
                                ))}

                                {/* line (설계 적용 추세) */}
                                <polyline
                                    fill='none'
                                    stroke='url(#lineGrad)'
                                    strokeWidth='6'
                                    points='160,280 360,210 560,160 760,120 960,80'
                                />
                                {/* 점 */}
                                {[
                                    { x: 160, y: 280 },
                                    { x: 360, y: 210 },
                                    { x: 560, y: 160 },
                                    { x: 760, y: 120 },
                                    { x: 960, y: 80 },
                                ].map((p, i) => (
                                    <circle key={i} cx={p.x} cy={p.y} r='8' fill='#60a5fa' />
                                ))}

                                {/* x labels */}
                                {['2021', '2022', '2023', '2024', '2025'].map((t, i) => (
                                    <text
                                        key={t}
                                        x={160 + i * 200}
                                        y='460'
                                        textAnchor='middle'
                                        fontSize='20'
                                        fill='var(--foreground)'
                                    >
                                        {t}
                                    </text>
                                ))}

                                {/* defs */}
                                <defs>
                                    <linearGradient id='barGrad' x1='0' x2='0' y1='0' y2='1'>
                                        <stop offset='0%' stopColor='#60a5fa' />
                                        <stop offset='100%' stopColor='#1e3a8a' />
                                    </linearGradient>
                                    <linearGradient id='lineGrad' x1='0' x2='1' y1='0' y2='0'>
                                        <stop offset='0%' stopColor='#93c5fd' />
                                        <stop offset='100%' stopColor='#38bdf8' />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <p className='mt-3 text-xs muted-foreground'>
                            * 코칭 수강 전/후 평균 서류 통과율 비교
                        </p>
                    </div>
                </div>
            </section>

            {/* CAPABILITY (페이드 인/아웃 배경) */}
            <section className='relative isolate'>
                {/* 아래로 서서히 진해지는 페이드 */}

                <div className='max-w-7xl mx-auto px-4 py-20'>
                    <h3 className='text-2xl md:text-3xl font-extrabold foreground text-center'>
                        이제, 실력의 기준은 <span className='text-blue-400'>설계력</span>
                    </h3>
                    <p className='mt-3 text-center muted-foreground max-w-3xl mx-auto'>
                        문제 정의부터 구조 설계, 지표화까지. 문서 한 장에도 전략이 스며들어야
                        합니다.
                    </p>

                    <div className='mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                        {[
                            { n: '1. 문제 정의', d: '채용 포지션 맥락/핵심 요구 역량 정리' },
                            { n: '2. 상황 분석', d: '경험 인벤토리 정리·JD 매핑' },
                            { n: '3. 해결 설계', d: '스토리라인/문항 구조/키워드 최적화' },
                            { n: '4. 평가·지표', d: '성과/임팩트 수치화 & 일관성 검수' },
                        ].map((it) => (
                            <div
                                key={it.n}
                                className='rounded-2xl p-6 border border-white/10 bg-white/5 backdrop-blur
                     hover:bg-white/10 transition-colors'
                            >
                                <div className='h-10 w-10 rounded-xl bg-blue-600/90 flex items-center justify-center text-white font-bold'>
                                    {it.n.split('.')[0]}
                                </div>
                                <h4 className='mt-4 muted-foreground font-semibold'>{it.n}</h4>
                                <p className='mt-2 muted-foreground70 text-sm leading-relaxed'>
                                    {it.d}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PAIN POINTS SECTION */}
            <section className='bg-blue-50 text-gray-900'>
                <div className='max-w-5xl mx-auto px-4 py-20'>
                    <div className='text-center mb-12'>
                        <h2 className='text-2xl md:text-3xl font-extrabold mb-4'>
                            이런 생각, 한 번이라도 해보셨나요?
                        </h2>
                        <div className='space-y-6 text-left max-w-3xl mx-auto'>
                            <SpeechBubble
                                text={
                                    <>
                                        <span className='text-blue-600 font-semibold'>
                                            “이런 경험”
                                        </span>
                                        도 자소서에 써도 될까?
                                    </>
                                }
                            />
                            <SpeechBubble
                                text={
                                    <>
                                        현직자가 말하는{' '}
                                        <span className='text-blue-600 font-semibold'>
                                            “무조건 거르는 지원자 유형”
                                        </span>
                                        은?
                                    </>
                                }
                            />
                            <SpeechBubble
                                text={
                                    <>
                                        실제 면접에서 나오는{' '}
                                        <span className='text-blue-600 font-semibold'>
                                            “까다로운 질문”
                                        </span>
                                        은 뭘까?
                                    </>
                                }
                            />
                        </div>
                        <p className='mt-10 text-lg font-medium text-gray-800'>
                            이제 이런 걱정하지 않아도 돼요
                        </p>
                        <p className='mt-2 text-2xl font-extrabold text-blue-600'>
                            현직자와 함께 준비하세요
                        </p>
                    </div>
                </div>
            </section>

            {/* BENEFITS */}
            <section className='bg-[#212121] border-y border-gray-700'>
                <div className='max-w-7xl mx-auto px-4 py-16 lg:py-20'>
                    <div className='grid md:grid-cols-3 gap-6'>
                        <BenefitCard
                            icon={<Target className='h-6 w-6' />}
                            title='현직자와 함께'
                            desc='멘토링·자소서 첨삭·면접 코칭까지 한 번에.'
                        />
                        <BenefitCard
                            icon={<PenTool className='h-6 w-6' />}
                            title='문항별 자소서 코칭'
                            desc='핵심 스토리라인·구조·어휘까지 문항별로 세밀히 다듬습니다.'
                        />
                        <BenefitCard
                            icon={<Rocket className='h-6 w-6' />}
                            title='스피드 첨삭'
                            desc='최대 24시간 이내 피드백 · 마감 전날 긴급 대응.'
                        />
                    </div>
                </div>
            </section>

            {/* LIST */}
            <section id='coaching-list' className='bg-gray-100 text-gray-900'>
                <div className='max-w-7xl mx-auto px-4 py-20'>
                    <div className='text-center mb-12'>
                        <h2 className='text-3xl lg:text-4xl font-extrabold tracking-tight mb-3'>
                            이력서·자소서 코칭
                        </h2>
                        <p className='text-gray-600'>
                            현직자와 함께 빠르게, 정확하게. 원하는 방식으로 선택하세요.
                        </p>
                    </div>

                    {/* 서비스 카드는 추후 컴포넌트와 연결해야 함 */}
                    <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                        <ServiceCard
                            badge='베스트'
                            title='이력서 집중 코칭(개발자)'
                            subtitle='JD 기반 역량 매핑 + 문장 다듬기'
                            price={69000}
                            rating={4.94}
                            reviews={321}
                            bullets={[
                                '핵심 경험 재구성',
                                '임팩트 지표·키워드 강화',
                                'ATS 가독성 개선',
                            ]}
                        />
                        <ServiceCard
                            badge='실시간'
                            title='자소서 1:1 화상 코칭'
                            subtitle='문항 구조 설계 + 실시간 피드백'
                            price={99000}
                            rating={4.9}
                            reviews={182}
                            bullets={[
                                '문항별 스토리라인 설계',
                                '면접 연계 질문 대비',
                                '최대 24시간 내 추가 코멘트',
                            ]}
                        />
                        <ServiceCard
                            badge='패키지'
                            title='서류 풀패키지(이력서+자소서)'
                            subtitle='전체 문서 일관성/브랜딩 정렬'
                            price={159000}
                            rating={5.0}
                            reviews={96}
                            bullets={[
                                '브랜딩 메시지 정렬',
                                '경험 카테고리 재배치',
                                '최종 검수 & 수정 1회',
                            ]}
                        />

                        {/* 추가 서비스 카드들 */}
                        {showAllServices && (
                            <>
                                <ServiceCard
                                    badge='신규'
                                    title='포트폴리오 리뷰 코칭'
                                    subtitle='프로젝트 구조 및 기술 스택 최적화'
                                    price={45000}
                                    rating={4.8}
                                    reviews={78}
                                    bullets={[
                                        '프로젝트 구조 분석',
                                        '기술 스택 최적화',
                                        'README 작성 가이드',
                                    ]}
                                />
                                <ServiceCard
                                    badge='인기'
                                    title='면접 대비 코칭'
                                    subtitle='기술 면접 + 인성 면접 종합 준비'
                                    price={120000}
                                    rating={4.9}
                                    reviews={156}
                                    bullets={[
                                        '기술 질문 대비',
                                        '인성 질문 연습',
                                        '실전 면접 시뮬레이션',
                                    ]}
                                />
                                <ServiceCard
                                    badge='특가'
                                    title='이력서 기본 패키지'
                                    subtitle='신입 개발자 맞춤 이력서 작성'
                                    price={35000}
                                    rating={4.7}
                                    reviews={89}
                                    bullets={[
                                        '기본 이력서 작성',
                                        '프로젝트 경험 정리',
                                        '기술 스택 정리',
                                    ]}
                                />
                                <ServiceCard
                                    badge='프리미엄'
                                    title='VIP 종합 코칭'
                                    subtitle='이력서+자소서+면접+포트폴리오 전체'
                                    price={250000}
                                    rating={5.0}
                                    reviews={45}
                                    bullets={[
                                        '전체 서류 패키지',
                                        '1:1 면접 코칭 3회',
                                        '포트폴리오 리뷰',
                                        '무제한 수정 지원',
                                    ]}
                                />
                                <ServiceCard
                                    badge='빠른'
                                    title='긴급 자소서 첨삭'
                                    subtitle='24시간 내 완성 보장'
                                    price={80000}
                                    rating={4.6}
                                    reviews={124}
                                    bullets={[
                                        '24시간 내 완성',
                                        '긴급 마감 대응',
                                        '핵심만 간추려서',
                                    ]}
                                />
                                <ServiceCard
                                    badge='맞춤'
                                    title='대기업 특화 코칭'
                                    subtitle='삼성, LG, SK 등 대기업 맞춤'
                                    price={180000}
                                    rating={4.9}
                                    reviews={67}
                                    bullets={[
                                        '대기업 채용 트렌드 분석',
                                        '특화 자소서 작성',
                                        '면접 질문 예상 문제',
                                    ]}
                                />
                            </>
                        )}
                    </div>

                    <div className='text-center mt-10'>
                        {!showAllServices ? (
                            <Button
                                onClick={loadMoreServices}
                                className='bg-gray-900 text-white hover:bg-black rounded-xl px-8 py-6'
                            >
                                서비스 더 보러 가기
                                <ArrowRight className='ml-2 h-5 w-5' />
                            </Button>
                        ) : (
                            <p className='text-gray-500 text-sm'>모든 서비스를 확인했습니다</p>
                        )}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className='relative overflow-hidden'>
                <div className='absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 opacity-80' />
                <div className='relative max-w-5xl mx-auto px-4 py-20 text-center'>
                    <h3 className='text-3xl md:text-5xl font-extrabold tracking-tight'>
                        지금 바로 시작하세요
                    </h3>
                    <p className='mt-4 text-white/90 max-w-2xl mx-auto'>
                        현직자와 함께 서류 경쟁력을 단숨에 끌어올리세요. 5분이면 준비 완료, 언제든
                        중단 가능.
                    </p>
                    <div className='mt-8 flex justify-center'>
                        <Button
                            onClick={scrollToList}
                            size='lg'
                            className='bg-white text-gray-900 hover:bg-gray-100 rounded-2xl px-8 py-6'
                        >
                            코칭 신청하기 <ArrowRight className='ml-2 h-5 w-5' />
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SpeechBubble({ text }: { text: React.ReactNode }) {
    return (
        <div className='bg-white rounded-xl p-4 shadow relative'>
            <p className='text-gray-800 text-base leading-relaxed text-center'>{text}</p>
            <div className='absolute -bottom-3 left-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white'></div>
        </div>
    );
}

function BenefitCard({
    icon,
    title,
    desc,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <Card className='bg-[#212121] border-gray-700 text-white'>
            <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                    <div className='h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center'>
                        <div className='text-white'>{icon}</div>
                    </div>
                    <div>
                        <h4 className='text-lg font-semibold text-white'>{title}</h4>
                        <p className='text-gray-300 mt-1 text-sm leading-relaxed'>{desc}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ServiceCard({
    badge,
    title,
    subtitle,
    price,
    rating,
    reviews,
    bullets,
}: {
    badge?: string;
    title: string;
    subtitle: string;
    price: number;
    rating: number;
    reviews: number;
    bullets: string[];
}) {
    return (
        <Card className='group overflow-hidden rounded-2xl border-gray-200 hover:shadow-2xl transition-all'>
            <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        {badge && <Badge className='bg-blue-500 text-white'>{badge}</Badge>}
                        <div className='flex items-center gap-1 text-blue-500'>
                            <Star className='h-4 w-4 fill-current' />
                            <span className='text-sm font-semibold'>{rating.toFixed(2)}</span>
                            <span className='text-xs text-gray-500'>({reviews})</span>
                        </div>
                    </div>
                    <span className='text-sm text-gray-500'>최대 24시간 내</span>
                </div>
                <h3 className='text-lg font-bold text-gray-900'>{title}</h3>
                <p className='text-sm text-gray-600 mt-1'>{subtitle}</p>

                <ul className='mt-4 space-y-2'>
                    {bullets.map((b, i) => (
                        <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                            <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' /> {b}
                        </li>
                    ))}
                </ul>

                <div className='mt-6 flex items-end justify-between'>
                    <div>
                        <div className='text-sm text-gray-500'>가격</div>
                        <div className='text-2xl font-extrabold tracking-tight'>
                            {price.toLocaleString()}원
                        </div>
                    </div>
                    <Button className='rounded-xl bg-blue-600 text-white hover:bg-blue-700'>
                        신청하기 <ArrowRight className='ml-2 h-5 w-5' />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function Step({ index, title, desc }: { index: number; title: string; desc: string }) {
    return (
        <div className='rounded-2xl border border-gray-200 bg-white p-6'>
            <div className='flex items-center gap-3'>
                <div className='h-9 w-9 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold'>
                    {index}
                </div>
                <h4 className='text-lg font-semibold'>{title}</h4>
            </div>
            <p className='mt-3 text-gray-600 text-sm leading-relaxed'>{desc}</p>
        </div>
    );
}

function TrustCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
    return (
        <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-6'>
                <div className='flex items-start gap-4'>
                    <div className='h-11 w-11 rounded-xl bg-blue-600 text-white flex items-center justify-center'>
                        {icon}
                    </div>
                    <div>
                        <h4 className='text-lg font-semibold text-white'>{title}</h4>
                        <p className='text-gray-300 mt-1 text-sm leading-relaxed'>{desc}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
