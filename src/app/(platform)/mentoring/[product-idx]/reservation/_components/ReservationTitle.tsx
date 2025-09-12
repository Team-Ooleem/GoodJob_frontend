import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export function ReservationTitle() {
    return (
        <div className='flex justify-start items-center gap-3'>
            <Avatar className='w-9 h-9'>
                <AvatarImage src='https://github.com/shadcn.png' />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className='flex flex-col justify-start items-start gap-1'>
                <p className='text-sm font-semibold'>
                    #모의면접 #이력서 검토 #백엔드개발 #사이드프로젝트 #개발자 커리어 #IT 업무
                    #매니징
                </p>
                <div className='flex h-3 justify-start items-center gap-1'>
                    <span className='text-sm font-normal'>포로</span>
                    <Separator orientation='vertical' />
                    <span className='text-sm font-normal text-chart-2'>1시간</span>
                </div>
            </div>
        </div>
    );
}
