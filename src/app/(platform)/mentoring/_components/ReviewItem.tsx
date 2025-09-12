import { StarRating } from '@/components/mentoring';
import { Separator } from '@/components/ui/separator';

export function ReviewItem() {
    return (
        <div className='pb-8 flex flex-col gap-3'>
            <p className='text-base text-foreground'>2025. 09. 07. 22:58</p>
            <div className='flex flex-col gap-1 pb-8'>
                <div className='flex justify-start items-center gap-1.5'>
                    <StarRating rating={5} size={20} />
                    <span className='text-base'>5.0</span>
                </div>
                <p className='whitespace-pre-line text-base'>
                    {`모의면접 진행했고 중요한 부분들 꼭 집어서 피드백 해주셔서 너무 좋았습니다. 다음에는\n커리어 멘토링으로 신청하려고 해요. 감사합니다 멘토님.`}
                </p>
            </div>
            <Separator />
        </div>
    );
}
