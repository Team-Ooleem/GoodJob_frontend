import { Button } from '@/components/ui/button';
import { ClockIcon } from '@radix-ui/react-icons';

export function BuyCard() {
    return (
        <div className='w-[365px] rounded-[7px] border bg-background p-4 flex flex-col gap-5'>
            <p className='text-2xl font-semibold'>₩49,500</p>
            <Button className='px-6 w-full h-[50px] font-semibold text-base'>
                멘토링 신청하기
            </Button>
        </div>
    );
}
