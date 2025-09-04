import { Flex } from 'antd';

// global components
import { Header, Footer, JobCardList } from '@/components';

export default function Home() {
    const jobList = [
        {
            id: 'job-1',
            imageUrl: '/assets/job-card-temp.webp',
            title: 'Product Designer',
            company: '지엔터프라이즈',
            location: '서울 강남구',
            experience: '경력 7년 이상',
        },
        {
            id: 'job-2',
            imageUrl: '/assets/job-card-temp.webp',
            title: 'Product Designer',
            company: '지엔터프라이즈',
            location: '서울 강남구',
            experience: '경력 7년 이상',
        },
        {
            id: 'job-3',
            imageUrl: '/assets/job-card-temp.webp',
            title: 'Product Designer',
            company: '지엔터프라이즈',
            location: '서울 강남구',
            experience: '경력 7년 이상',
        },
        {
            id: 'job-4',
            imageUrl: '/assets/job-card-temp.webp',
            title: 'Product Designer',
            company: '지엔터프라이즈',
            location: '서울 강남구',
            experience: '경력 7년 이상',
        },
        {
            id: 'job-5',
            imageUrl: '/assets/job-card-temp.webp',
            title: 'Product Designer',
            company: '지엔터프라이즈',
            location: '서울 강남구',
            experience: '경력 7년 이상',
        },
        {
            id: 'job-6',
            imageUrl: '/assets/job-card-temp.webp',
            title: 'Product Designer',
            company: '지엔터프라이즈',
            location: '서울 강남구',
            experience: '경력 7년 이상',
        },
        {
            id: 'job-7',
            imageUrl: '/assets/job-card-temp.webp',
            title: 'Product Designer',
            company: '지엔터프라이즈',
            location: '서울 강남구',
            experience: '경력 7년 이상',
        },
    ];

    return (
        <>
            <Header />
            <div className='w-full h-[237px] bg-blue-500'></div>
            <div className='w-[1400px] mx-auto pt-32 pb-52'>
                <JobCardList title='모두가 주목하고 있어요!' data={jobList} />
                <JobCardList title='모두가 주목하고 있어요!' data={jobList} />
                <JobCardList title='모두가 주목하고 있어요!' data={jobList} />
            </div>
            <Footer />
        </>
    );
}
