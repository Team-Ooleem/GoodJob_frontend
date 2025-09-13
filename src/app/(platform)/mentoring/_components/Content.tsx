import { MentorProductProfile, BuyCard } from '@/components/mentoring';
interface IContent {
    children?: React.ReactNode;
}

export function Content({ children }: IContent) {
    return (
        <div className='p-8'>
            <div className='w-[1140px] relative mx-auto flex justify-start items-start'>
                <div className='w-[700px]'>{children}</div>
                <aside className='w-auto mx-auto sticky top-3 flex justify-end -mt-70'>
                    <div className='flex flex-col gap-2'>
                        <MentorProductProfile />
                        <BuyCard />
                    </div>
                </aside>
            </div>
        </div>
    );
}
