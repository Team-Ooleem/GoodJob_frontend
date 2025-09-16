import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function ScrollToNavigator() {
    return (
        <>
            <div className='h-14'>
                <div className='w-[1140px] h-full mx-auto flex justify-start items-center gap-2'>
                    <Button variant='secondary' size='lg'>
                        멘토링 소개
                    </Button>
                    <Button variant='ghost' size='lg'>
                        멘토링 리뷰
                    </Button>
                </div>
            </div>
            <Separator />
        </>
    );
}
