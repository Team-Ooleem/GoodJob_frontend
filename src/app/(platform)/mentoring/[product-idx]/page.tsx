import { MentorProductProfile, BuyCard, StarRating } from '@/components/mentoring';
import { ScrollToNavigator, Content, ReviewsSummary } from '../_components';

export default function ProductDetailPage() {
    return (
        <>
            <div className='w-full px-8 py-12 bg-muted'>
                <div className='w-[1140px] mx-auto flex justify-between'>
                    <div className='w-[700px] flex flex-col gap-3'>
                        <div className='flex flex-col gap-2'>
                            <p className='text-sm'>개발 · 프로그래밍</p>
                            <h1 className='text-4xl font-semibold'>
                                #모의면접 #이력서 검토 #백엔드개발 #사이드프로젝트 #개발자 커리어
                                #IT 업무 #매니징
                            </h1>
                        </div>
                        <div className='flex justify-start items-center gap-3'>
                            <div className='flex items-center gap-2'>
                                <StarRating rating={5} />
                                <p className='text-sm font-bold underline decoration-1'>
                                    (5.0) 리뷰 70개
                                </p>
                            </div>
                            <p className='text-sm font-normal'>
                                멘티 <span className='font-bold'>162명</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <ScrollToNavigator />
            <Content>
                Content
                <ReviewsSummary />
            </Content>
            <aside className='w-[1140px] h-0 max-h-0 mx-auto sticky top-3 flex justify-end -mt-78'>
                <div className='flex flex-col gap-2 absolute'>
                    <MentorProductProfile />
                    <BuyCard />
                </div>
            </aside>
        </>
    );
}
