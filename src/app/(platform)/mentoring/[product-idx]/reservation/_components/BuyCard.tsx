'use client';

import * as PortOne from '@portone/browser-sdk/v2';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';

type Props = {
    price?: number;
    productTitle?: string;
    productIdx?: string;
    selectedDate?: Date;
    selectedSlot?: string | null;
    selectedRegularSlotsIdx?: number | null;
    mentorName?: string;
    messageToMentor?: string;
};

export function BuyCard({
    price,
    productTitle,
    productIdx,
    selectedDate,
    selectedSlot,
    selectedRegularSlotsIdx,
    mentorName,
    messageToMentor,
}: Props) {
    const router = useRouter();
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handlePayment = async () => {
        try {
            // 에러 상태 초기화
            setPaymentError(null);

            const response = await PortOne.requestPayment({
                // Store ID 설정
                storeId: 'store-4d643eb5-9627-4a21-8ccb-afe898276907',
                // 채널 키 설정
                channelKey: 'channel-key-de52913e-4fac-4dc0-9953-abfd21555353',
                paymentId: `payment-${crypto.randomUUID()}`,
                orderName: productTitle || '멘토링 상품',
                totalAmount: typeof price === 'number' ? price : 0,
                currency: 'CURRENCY_KRW',
                payMethod: 'CARD',
            });

            console.log('PortOne 응답:', response);

            // 성공/실패 판별: 성공 payload에는 code가 없고, 실패/취소에는 code가 있음
            const isError = (
                res: any,
            ): res is { code: string; message?: string; pgCode?: string } =>
                typeof res === 'object' && res !== null && 'code' in res;

            if (!isError(response) && response?.paymentId && productIdx) {
                // 성공 처리
                const reservationData = {
                    paymentId: response.paymentId,
                    productTitle,
                    mentorName,
                    selectedDate: selectedDate?.toISOString(),
                    selectedSlot,
                    selectedRegularSlotsIdx,
                    price,
                    messageToMentor,
                };

                const searchParams = new URLSearchParams();
                Object.entries(reservationData).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) searchParams.set(key, String(value));
                });

                router.push(
                    `/mentoring/${productIdx}/reservation/success?${searchParams.toString()}`,
                );
            } else {
                // 실패/취소 처리
                console.log('결제가 취소되었거나 실패했습니다:', response);

                if (isError(response)) {
                    if (
                        response.code === 'FAILURE_TYPE_PG' &&
                        response.pgCode === 'PAY_PROCESS_CANCELED'
                    ) {
                        setPaymentError('결제가 취소되었습니다. 다시 시도해 주세요.');
                    } else {
                        setPaymentError(
                            response.message || '결제 중 오류가 발생했습니다. 다시 시도해 주세요.',
                        );
                    }
                } else {
                    setPaymentError('결제 중 오류가 발생했습니다. 다시 시도해 주세요.');
                }
            }
        } catch (error: any) {
            console.error('Payment request failed:', error);
            setPaymentError(
                error?.message || '결제 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            );
        }
    };

    return (
        <div className='w-full max-w-sm space-y-4'>
            {/* 결제 에러 알림 */}
            {paymentError && (
                <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription className='flex items-center justify-between'>
                        <span>{paymentError}</span>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setPaymentError(null)}
                            className='h-6 w-6 p-0 hover:bg-destructive/20'
                        >
                            <X className='h-3 w-3' />
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <Card className='w-full'>
                <CardHeader>
                    <CardDescription className='flex justify-between items-center'>
                        <p className='text-base font-bold text-foreground'>총 결제 금액</p>
                        <p className='text-base font-bold text-foreground'>
                            {typeof price === 'number'
                                ? new Intl.NumberFormat('ko-KR', {
                                      style: 'currency',
                                      currency: 'KRW',
                                  }).format(price)
                                : '-'}
                        </p>
                    </CardDescription>
                </CardHeader>
                <CardFooter className='flex-col gap-2'>
                    <Button
                        type='submit'
                        className='w-full h-[50px] text-lg font-semibold'
                        onClick={handlePayment}
                        disabled={typeof price !== 'number' || price <= 0}
                    >
                        결제하기
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
