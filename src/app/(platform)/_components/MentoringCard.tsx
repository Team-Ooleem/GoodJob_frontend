import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MentoringProduct } from '../_apis/mentoring-product-api';

interface MentoringCardProps {
    mentoring: MentoringProduct;
}

export const MentoringCard = ({ mentoring }: MentoringCardProps) => {
    return (
        <div className='w-full rounded-[7px] border bg-background hover:shadow-lg hover:-translate-y-1 transition-all duration-300'>
            <div className='p-4'>
                {/* 멘토 프로필 섹션 */}
                <div className='flex justify-start items-center gap-4 mb-4'>
                    <Avatar className='w-16 h-16'>
                        <AvatarImage src={mentoring?.mentor?.profile_img} />
                        <AvatarFallback>
                            {mentoring?.mentor?.nickname?.slice(0, 2) || '??'}
                        </AvatarFallback>
                    </Avatar>
                    <div className='py-2 flex-1'>
                        <p className='text-lg font-bold mb-1'>
                            {mentoring?.mentor?.nickname || '알 수 없는 멘토'}
                        </p>
                        <p className='text-sm text-muted-foreground line-clamp-2 leading-relaxed'>
                            {mentoring?.mentor?.profile || '프로필 정보가 없습니다.'}
                        </p>
                    </div>
                </div>

                {/* 멘토링 제목 */}
                <h3 className='font-semibold text-sm leading-relaxed text-foreground line-clamp-2 mb-4'>
                    {mentoring?.title || '제목이 없습니다.'}
                </h3>

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
                        ₩{mentoring?.price ? Number(mentoring.price).toLocaleString() : '0'} &#40;
                        1시간 &#41;
                    </span>
                    <Link href={`/mentoring/${mentoring?.product_idx || ''}`}>
                        <Button className='px-6 font-semibold text-sm bg-foreground text-background hover:bg-foreground/90 cursor-pointer'>
                            멘토링 신청하기
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
