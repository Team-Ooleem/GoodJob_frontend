import { Button } from '@/components/ui/button';

type Props = {
    price?: number;
};

function formatCurrencyKRW(value?: number) {
    if (typeof value !== 'number') return '-';
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
}

export function BuyCard({ price }: Props) {
    return (
        <div className='w-[365px] rounded-[7px] border bg-background p-4 flex flex-col gap-5'>
            <p className='text-2xl font-semibold'>{formatCurrencyKRW(price)}</p>
            <Button className='px-6 w-full h-[50px] font-semibold text-base'>
                멘토링 신청하기
            </Button>
        </div>
    );
}
