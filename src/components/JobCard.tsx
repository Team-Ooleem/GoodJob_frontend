'use client';

import { Suspense } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Flex } from 'antd';

// global types
import type { JobProps } from '@/types';

type JobCardProps = JobProps & {
    variant?: 'large' | 'small';
    style?: CSSProperties;
};

export function JobCard({
    imageUrl,
    title,
    company,
    location,
    experience,
    variant = 'large',
    style,
}: JobCardProps) {
    const isLarge = variant === 'large';

    return (
        <Flex
            vertical={isLarge}
            gap={isLarge ? 8 : 13}
            justify={isLarge ? 'center' : 'start'}
            align={isLarge ? 'start' : 'center'}
            style={style}
        >
            <Image
                src={imageUrl}
                alt={`${company} ${title}`}
                width={isLarge ? 264 : 120}
                height={isLarge ? 176 : 90}
                className='rounded-xl object-cover'
                sizes={
                    isLarge ? '(min-width: 1024px) 264px, 50vw' : '(min-width: 1024px) 120px, 33vw'
                }
                loading='lazy'
            />
            <Flex vertical gap={isLarge ? 5 : 3}>
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
