'use client';

import * as PortOne from '@portone/browser-sdk/v2';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';

type Props = {
    price?: number;
    productTitle?: string;
    productIdx?: string;
    selectedDate?: Date;
    selectedSlot?: string | null;
    mentorName?: string;
};

export function BuyCard({
    price,
    productTitle,
    productIdx,
    selectedDate,
    selectedSlot,
    mentorName,
}: Props) {
    const router = useRouter();

    const handlePayment = async () => {
        try {
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

            if (response?.paymentId && productIdx) {
                const reservationData = {
                    paymentId: response.paymentId,
                    productTitle,
                    mentorName,
                    selectedDate: selectedDate?.toISOString(),
                    selectedSlot,
                    price,
                };

                const searchParams = new URLSearchParams();
                Object.entries(reservationData).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        searchParams.set(key, String(value));
                    }
                });

                router.push(
                    `/mentoring/${productIdx}/reservation/success?${searchParams.toString()}`,
                );
            }
        } catch (error) {
            console.error('Payment request failed:', error);
        }
    };

    return (
        <Card className='w-full max-w-sm'>
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
    );
}
