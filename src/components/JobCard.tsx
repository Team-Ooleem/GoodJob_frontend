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
            <Suspense
                fallback={
                    <div
                        className={`rounded-xl bg-neutral-300 ${
                            isLarge ? 'w-[264px] h-[176px]' : 'w-[120px] h-[90px]'
                        }`}
                    />
                }
            >
                <Image
                    src={imageUrl}
                    alt='임시 이미지'
                    width={isLarge ? 264 : 120}
                    height={isLarge ? 176 : 90}
                    className='rounded-xl object-cover'
                />
            </Suspense>
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
