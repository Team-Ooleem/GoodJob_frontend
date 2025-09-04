import { Row, Col } from 'antd';

// global components
import { JobCard } from './JobCard';

// global types
import { JobProps } from '@/types';

type JobCardList = {
    title: string;
    data: (JobProps & { id: string })[];
    variant?: 'large' | 'small';
};

export function JobCardList({ title, data, variant = 'large' }: JobCardList) {
    const isLarge = variant === 'large';

    return (
        <div>
            <h1 className='font-semibold text-xl mb-6'>{title}</h1>
            <Row gutter={[20, isLarge ? 75 : 32]} wrap align='top' justify='start'>
                {data.map((job) => (
                    <Col key={job.id} flex={isLarge ? '20%' : '33.33%'}>
                        <JobCard {...job} variant={variant} />
                    </Col>
                ))}
            </Row>
        </div>
    );
}
