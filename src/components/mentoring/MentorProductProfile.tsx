import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CodeIcon, GlobeIcon, CubeIcon } from '@radix-ui/react-icons';

export function MentorProductProfile() {
    return (
        <div className='w-[365px] rounded-[7px] border bg-background p-4'>
            <div className='flex justify-start items-center gap-4.5'>
                <Avatar className='w-28 h-28'>
                    <AvatarImage src='https://github.com/shadcn.png' />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className='py-2'>
                    <p className='text-lg font-bold mb-1.5'>김멘토</p>
                    <div className='flex flex-col gap-0.5'>
                        <p className='text-sm flex justify-start items-center gap-1.5'>
                            <CodeIcon className='text-chart-3' />
                            백엔드/서버 개발자
                        </p>
                        <p className='text-sm flex justify-start items-center gap-1.5'>
                            <GlobeIcon className='text-chart-3' />
                            시니어 (9년 이상)
                        </p>
                        <p className='text-sm flex justify-start items-center gap-1.5'>
                            <CubeIcon className='text-chart-3' />
                            빅테크
                        </p>
                    </div>
                </div>
            </div>
            <div className='flex justify-center items-center py-3 bg-muted rounded-[7px] mt-4'>
                <div className='text-center flex-1'>
                    <p className='text-xs font-medium'>함께한 멘티</p>
                    <p className='text-sm font-semibold'>162</p>
                </div>
                <div className='text-center flex-1'>
                    <p className='text-xs font-medium'>멘토링 리뷰</p>
                    <p className='text-sm font-semibold'>70</p>
                </div>
                <div className='text-center flex-1'>
                    <p className='text-xs font-medium'>멘토링 평점</p>
                    <p className='text-sm font-semibold'>5.0</p>
                </div>
            </div>
        </div>
    );
}
