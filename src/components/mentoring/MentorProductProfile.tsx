import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CodeIcon, GlobeIcon, CubeIcon } from '@radix-ui/react-icons';

type Props = {
    mentorName?: string;
    mentorAvatar?: string | null;
    jobTitle?: string;
    seniority?: string;
    companyType?: string;
    menteeCount?: number;
    reviewCount?: number;
    ratingAverage?: number;
};

export function MentorProductProfile({
    mentorName,
    mentorAvatar,
    jobTitle,
    seniority,
    companyType,
    menteeCount,
    reviewCount,
    ratingAverage,
}: Props) {
    return (
        <div className='w-[365px] rounded-[7px] border bg-background p-4'>
            <div className='flex justify-start items-center gap-4.5'>
                <Avatar className='w-28 h-28'>
                    {mentorAvatar ? (
                        <AvatarImage src={mentorAvatar} />
                    ) : (
                        <AvatarFallback>MN</AvatarFallback>
                    )}
                </Avatar>
                <div className='py-2'>
                    <p className='text-lg font-bold mb-1.5'>{mentorName || '멘토'}</p>
                    <div className='flex flex-col gap-0.5'>
                        <p className='text-sm flex justify-start items-center gap-1.5'>
                            <CodeIcon className='text-chart-3' />
                            {jobTitle || '직무 정보 없음'}
                        </p>
                        <p className='text-sm flex justify-start items-center gap-1.5'>
                            <GlobeIcon className='text-chart-3' />
                            {seniority || '경력 정보 없음'}
                        </p>
                        <p className='text-sm flex justify-start items-center gap-1.5'>
                            <CubeIcon className='text-chart-3' />
                            {companyType || '회사 유형 정보 없음'}
                        </p>
                    </div>
                </div>
            </div>
            <div className='flex justify-center items-center py-3 bg-muted rounded-[7px] mt-4'>
                <div className='text-center flex-1'>
                    <p className='text-xs font-medium'>함께한 멘티</p>
                    <p className='text-sm font-semibold'>{menteeCount ?? '-'}</p>
                </div>
                <div className='text-center flex-1'>
                    <p className='text-xs font-medium'>멘토링 리뷰</p>
                    <p className='text-sm font-semibold'>{reviewCount ?? '-'}</p>
                </div>
                <div className='text-center flex-1'>
                    <p className='text-xs font-medium'>멘토링 평점</p>
                    <p className='text-sm font-semibold'>{ratingAverage?.toFixed(1) ?? '-'}</p>
                </div>
            </div>
        </div>
    );
}
