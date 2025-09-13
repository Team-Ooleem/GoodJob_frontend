import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Props = {
    price?: number;
    productIdx?: number | string;
};

function formatCurrencyKRW(value?: number) {
    if (typeof value !== 'number') return '-';
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
}

export function BuyCard({ price, productIdx }: Props) {
    return (
        <div className='w-[365px] rounded-[7px] border bg-background p-4 flex flex-col gap-5'>
            <p className='text-2xl font-semibold'>{formatCurrencyKRW(price)}</p>
            <Button
                asChild
                className='px-6 w-full h-[50px] font-semibold text-base'
                disabled={!productIdx}
            >
                <Link
                    href={productIdx ? `/mentoring/${productIdx}/reservation` : '#'}
                    prefetch={false}
                >
                    멘토링 신청하기
                </Link>
            </Button>
        </div>
    );
}
