import { Flex } from 'antd';

// global components
import { JobCard } from './JobCard';

// global types
import { JobProps } from '@/types';

type JobCardList = {
    title: string;
    data: JobProps[];
};

export function JobCardList({ title, data }: JobCardList) {
    return (
        <Flex vertical gap={25}>
            <h1 className='font-semibold text-xl'>{title}</h1>
            <Flex gap={20}>
                {data.map((job) => (
                    <JobCard {...job} />
                ))}
            </Flex>
        </Flex>
    );
}
