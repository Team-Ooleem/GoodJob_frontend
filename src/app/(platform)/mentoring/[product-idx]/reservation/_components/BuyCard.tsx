import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';

export function BuyCard() {
    return (
        <Card className='w-full max-w-sm'>
            <CardHeader>
                <CardDescription className='flex justify-between items-center'>
                    <p className='text-base font-bold text-foreground'>총 결제 금액</p>
                    <p className='text-base font-bold text-foreground'>₩49,500</p>
                </CardDescription>
            </CardHeader>
            <CardFooter className='flex-col gap-2'>
                <Button type='submit' className='w-full h-[50px] text-lg font-semibold'>
                    결제하기
                </Button>
            </CardFooter>
        </Card>
    );
}
