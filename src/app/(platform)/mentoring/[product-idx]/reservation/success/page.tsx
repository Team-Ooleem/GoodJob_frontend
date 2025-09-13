import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    CheckCircledIcon,
    CalendarIcon,
    ClockIcon,
    InfoCircledIcon,
    PersonIcon,
} from '@radix-ui/react-icons';

type Props = { params: { 'product-idx': string } };

export default function ReservationSuccessPage({ params }: Props) {
    const productId = params['product-idx'];

    return (
        <main className='w-full px-4 py-12 bg-muted/30'>
            <div className='mx-auto w-full max-w-[840px]'>
                <Card className='border-0 shadow-md'>
                    <CardHeader className='text-center'>
                        <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
                            <CheckCircledIcon className='h-7 w-7 text-primary' />
                        </div>
                        <CardTitle className='text-2xl font-bold'>결제가 완료되었어요!</CardTitle>
                        <CardDescription>멘토링 예약이 정상적으로 처리되었습니다.</CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-8'>
                        <Alert>
                            <InfoCircledIcon className='h-4 w-4' />
                            <AlertTitle>멘토 승인 대기</AlertTitle>
                            <AlertDescription>
                                결제 완료 후 24시간 내에 멘토의 승인이 있을 예정이에요. 승인 시
                                알림으로 안내드릴게요.
                            </AlertDescription>
                        </Alert>

                        <div className='grid grid-cols-1 gap-4 rounded-lg border bg-card p-4'>
                            <div className='flex items-center gap-3'>
                                <CalendarIcon className='h-5 w-5 text-muted-foreground' />
                                <div>
                                    <p className='text-sm text-muted-foreground'>결제 일시</p>
                                    <p className='font-medium'>주문이 접수되었습니다</p>
                                </div>
                            </div>
                            <div className='flex items-center gap-3'>
                                <ClockIcon className='h-5 w-5 text-muted-foreground' />
                                <div>
                                    <p className='text-sm text-muted-foreground'>결제 상태</p>
                                    <div className='mt-1'>
                                        <Badge>성공</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='rounded-lg border bg-card'>
                            <div className='px-4 py-3'>
                                <h3 className='text-sm font-medium'>상품 정보</h3>
                            </div>
                            <Separator />
                            <div className='grid grid-cols-1 gap-x-6 gap-y-4 p-4'>
                                <div>
                                    <p className='text-sm text-muted-foreground'>상품명</p>
                                    <p className='font-medium'>결제한 멘토링 상품</p>
                                </div>
                                <div className='flex items-start gap-2'>
                                    <div>
                                        <p className='text-sm text-muted-foreground'>멘토</p>
                                        <p className='font-medium'>멘토 이름</p>
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm text-muted-foreground'>세션</p>
                                    <p className='font-medium'>1:1 멘토링 · 60분</p>
                                </div>
                                <div>
                                    <p className='text-sm text-muted-foreground'>예약 번호</p>
                                    <p className='font-mono text-sm'>#{productId}-SUCCESS</p>
                                </div>
                                <div>
                                    <p className='text-sm text-muted-foreground'>결제 금액</p>
                                    <p className='font-medium'>확인 가능</p>
                                </div>
                                <div>
                                    <p className='text-sm text-muted-foreground'>진행 방식</p>
                                    <p className='font-medium'>온라인(화상)</p>
                                </div>
                            </div>
                        </div>

                        <Separator className='my-6' />

                        <div className='flex flex-col items-start justify-between gap-3 md:flex-row md:items-center'>
                            <div>
                                <p className='text-sm text-muted-foreground'>주문번호</p>
                                <p className='font-mono text-sm'>#{productId}-SUCCESS</p>
                            </div>
                            <div className='flex gap-2'>
                                <Button asChild variant='secondary'>
                                    <Link href={`/mentoring/${productId}`}>멘토링 상세로 이동</Link>
                                </Button>
                                <Button asChild>
                                    <Link href='/'>홈으로 가기</Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className='justify-center'>
                        <p className='text-xs text-muted-foreground'>
                            문제가 있나요? 고객센터로 문의해 주세요.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </main>
    );
}
