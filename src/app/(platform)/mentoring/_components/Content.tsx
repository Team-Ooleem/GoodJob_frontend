import { MentorProductProfile, BuyCard } from '@/components/mentoring';
import type { MentoringProduct } from '../_apis/mentoring-products.api';

interface IContent {
    children?: React.ReactNode;
    product?: MentoringProduct;
}

export function Content({ children, product }: IContent) {
    return (
        <div className='p-8'>
            <div className='w-[1140px] relative mx-auto flex justify-start items-start'>
                <div className='w-[700px]'>{children}</div>
                <aside className='w-auto mx-auto sticky top-3 flex justify-end -mt-70'>
                    <div className='flex flex-col gap-2'>
                        <MentorProductProfile
                            mentorName={product?.mentor?.name}
                            mentorAvatar={product?.mentor?.avatarUrl ?? null}
                            jobTitle={product?.mentor?.jobTitle}
                            seniority={product?.mentor?.seniority}
                            companyType={product?.mentor?.companyType}
                            menteeCount={product?.menteeCount}
                            reviewCount={product?.reviewCount}
                            ratingAverage={product?.ratingAverage}
                        />
                        <BuyCard price={product?.price} productIdx={product?.productIdx} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
