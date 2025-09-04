'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { Flex } from 'antd';

// global types
import type { JobProps } from '@/types';

type JobCardProps = JobProps;

export function JobCard({ imageUrl, title, company, location, experience }: JobCardProps) {
    return (
        <Flex vertical gap={8}>
            <Suspense fallback={<div className='w-[264px] h-[176px] rounded-xl bg-neutral-300' />}>
                <Image
                    src={imageUrl}
                    alt='임시 이미지'
                    width={264}
                    height={176}
                    className='rounded-xl object-cover'
                />
            </Suspense>
            <Flex vertical gap={5}>
                <h2 className='font-semibold text-neutral-800'>{title}</h2>
                <p className='text-sm text-neutral-500'>{company}</p>
                <Flex gap={3}>
                    <span className='text-sm text-neutral-500'>{location}</span>
                    <span className='text-sm text-neutral-500'>·</span>
                    <span className='text-sm text-neutral-500'>{experience}</span>
                </Flex>
            </Flex>
        </Flex>
    );
}
