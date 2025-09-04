import { Flex } from 'antd';

// global components
import { JobCard } from './JobCard';

// global types
import { JobProps } from '@/types';

type JobCardList = {
    title: string;
    data: (JobProps & { id: string })[];
};

export function JobCardList({ title, data }: JobCardList) {
    return (
        <Flex vertical gap={25}>
            <h1 className='font-semibold text-xl'>{title}</h1>
            <Flex style={{ rowGap: 75, columnGap: 20 }} wrap='wrap'>
                {data.map((job) => (
                    <JobCard key={job.id} {...job} />
                ))}
            </Flex>
        </Flex>
    );
}
