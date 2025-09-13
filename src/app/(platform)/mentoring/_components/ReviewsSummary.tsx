import { StarRating } from '../../../../components/mentoring';

export function ReviewsSummary() {
    return (
        <>
            <div className='flex justify-between items-center mb-4 mt-10'>
                <h4 className='text-xl font-semibold'>멘토링 리뷰</h4>
                <p className='text-sm text-muted-foreground flex gap-1'>
                    전체
                    <span className='text-foreground'>70개</span>
                </p>
            </div>
            <div className='flex flex-col justify-center items-center gap-2 py-5 border rounded-lg'>
                <p className='text-3xl font-bold'>5.0</p>
                <StarRating rating={5} size={25} />
                <p className='text-base text-foreground'>70개의 리뷰</p>
            </div>
        </>
    );
}
