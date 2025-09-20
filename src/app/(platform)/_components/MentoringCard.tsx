import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MentoringProduct } from '../_apis/mentoring-product-api';

interface MentoringCardProps {
    mentoring: MentoringProduct;
}

export const MentoringCard = ({ mentoring }: MentoringCardProps) => {
    return (
        <div className='w-full flex flex-col justify-between aspect-[6/3] sm:aspect-[215/100] md:aspect-[135/100] lg:aspect-[115/100] xl:aspect-[115/100] rounded-[7px] p-4 border bg-background shadow-lg hover:-translate-y-1 transition-all duration-300'>
            {/* 멘토 프로필 섹션 */}
            <div>
                {/* 멘토링 제목 */}
                <h3 className='font-semibold text-lg leading-relaxed text-foreground line-clamp-2'>
                    {mentoring?.title || '제목이 없습니다.'}
                </h3>
                <div className='flex justify-start items-start gap-4'>
                    <div className='py-2 flex-1'>
                        <p className='text-m font-bold mb-1'>
                            {mentoring?.mentor?.nickname || '알 수 없는 멘토'}
                        </p>
                        <p className='text-sm text-muted-foreground line-clamp-2 leading-relaxed'>
                            {mentoring?.mentor?.profile || '프로필 정보가 없습니다.'}
                        </p>
                    </div>
                    <Avatar className='w-16 h-16'>
                        <AvatarImage src={mentoring?.mentor?.profile_img} />
                        <AvatarFallback>
                            {mentoring?.mentor?.nickname?.slice(0, 2) || '??'}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div>
                {/* 통계 섹션 */}
                <div className='flex justify-center items-center py-3 bg-muted rounded-[7px] mb-4'>
                    <div className='text-center flex-1'>
                        <p className='text-xs font-medium'>함께한 멘티</p>
                        <p className='text-sm font-semibold'>{mentoring?.participants || 0}</p>
                    </div>
                    <div className='text-center flex-1'>
                        <p className='text-xs font-medium'>멘토링 평점</p>
                        <p className='text-sm font-semibold'>
                            {mentoring?.rating && mentoring.rating > 0 ? mentoring.rating : '-'}
                        </p>
                    </div>
                </div>

                {/* 가격 및 신청 버튼 */}
                <div className='flex items-center justify-between'>
                    <span className='text-l font-semibold text-foreground'>
                        ₩{mentoring?.price ? Number(mentoring.price).toLocaleString() : '0'}
                    </span>
                    <Link href={`/mentoring/${mentoring?.product_idx || ''}`}>
                        <Button className='px-6 font-semibold text-sm cursor-pointer'>
                            멘토링 신청하기
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
