import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Star,
    Building2,
    Calendar,
    FileText,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { mockCoachingResumeResults } from '../../_lib/mock-data';

interface CoachingResumeDetailPageProps {
    params: {
        id: string;
    };
}

export default function CoachingResumeDetailPage({ params }: CoachingResumeDetailPageProps) {
    const result = mockCoachingResumeResults.find((r) => r.id === params.id);

    if (!result) {
        notFound();
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 80) return 'text-blue-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreText = (score: number) => {
        if (score >= 90) return '우수';
        if (score >= 80) return '양호';
        if (score >= 70) return '보통';
        return '미흡';
    };

    return (
        <div className='space-y-6'>
            {/* 헤더 */}
            <div className='flex items-center gap-4'>
                <Link href='/my-page/coaching-resume-result'>
                    <Button variant='outline' size='sm'>
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        목록으로
                    </Button>
                </Link>
                <div>
                    <h1 className='text-2xl font-bold'>{result.title}</h1>
                    <p className='text-muted-foreground'>
                        {result.company} • {result.position}
                    </p>
                </div>
            </div>

            {/* 기본 정보 */}
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <CardTitle>이력서 코칭 정보</CardTitle>
                        <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                            {result.status === 'completed' ? '완료' : '진행중'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='flex items-center gap-2'>
                            <Calendar className='h-4 w-4 text-muted-foreground' />
                            <span className='text-sm'>코칭일</span>
                            <span className='font-medium'>{result.date}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <FileText className='h-4 w-4 text-muted-foreground' />
                            <span className='text-sm'>유형</span>
                            <span className='font-medium'>이력서 코칭</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Star className='h-4 w-4 text-yellow-500' />
                            <span className='text-sm'>점수</span>
                            <span className={`font-bold ${getScoreColor(result.score)}`}>
                                {result.score}점 ({getScoreText(result.score)})
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 피드백 섹션 */}
            <div className='grid gap-6 md:grid-cols-2'>
                {/* 전체 피드백 */}
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <CheckCircle className='h-5 w-5 text-green-500' />
                            전체 피드백
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className='text-sm leading-relaxed'>{result.feedback.overall}</p>
                    </CardContent>
                </Card>

                {/* 강점 */}
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <CheckCircle className='h-5 w-5 text-green-500' />
                            강점
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className='space-y-2'>
                            {result.feedback.strengths.map((strength, index) => (
                                <li key={index} className='flex items-start gap-2 text-sm'>
                                    <CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                                    <span>{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* 개선사항 */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <AlertCircle className='h-5 w-5 text-orange-500' />
                        개선사항
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className='space-y-2'>
                        {result.feedback.improvements.map((improvement, index) => (
                            <li key={index} className='flex items-start gap-2 text-sm'>
                                <AlertCircle className='h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0' />
                                <span>{improvement}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* 액션 버튼 */}
            <div className='flex gap-4 justify-end'>
                <Button variant='outline'>이력서 다운로드</Button>
                <Button>피드백 저장</Button>
            </div>
        </div>
    );
}
