import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type Props = {
    mentorName?: string;
    productTitle?: string;
    mentorAvatar?: string | null;
};

export function ReservationTitle({ mentorName, productTitle, mentorAvatar }: Props) {
    return (
        <div className='flex justify-start items-center gap-3'>
            <Avatar className='w-9 h-9'>
                {mentorAvatar ? (
                    <AvatarImage src={mentorAvatar} />
                ) : (
                    <AvatarFallback>MN</AvatarFallback>
                )}
            </Avatar>
            <div className='flex flex-col justify-start items-start gap-1'>
                <p className='text-sm font-semibold'>{productTitle || '멘토링'}</p>
                <div className='flex h-3 justify-start items-center gap-1'>
                    <span className='text-sm font-normal'>{mentorName || '멘토'}</span>
                    <Separator orientation='vertical' />
                    <span className='text-sm font-normal text-chart-2'>1시간</span>
                </div>
            </div>
        </div>
    );
}
