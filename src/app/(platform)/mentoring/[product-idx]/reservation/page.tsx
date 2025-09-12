'use client';

import { useState } from 'react';
import { addDays } from 'date-fns';

import { ReservationTitle, FormCard, HourSlot } from './_components';
import { Calendar } from '@/components/ui/calendar';

export default function ReservationPage() {
    const [date, setDate] = useState<Date | undefined>(undefined);

    return (
        <div className='w-full p-8'>
            <div className='w-[1140px] mx-auto'>
                <div className='w-[830px]'>
                    <div className='mb-6'>
                        <h1 className='text-2xl font-bold mb-5'>멘토링 신청</h1>
                        <ReservationTitle />
                    </div>
                    <FormCard title='1. 일정 선택'>
                        <p className='text-xs text-muted-foreground mb-1'>
                            신청일 기준 3일 뒤부터 선택할 수 있어요.
                        </p>
                        <div className='flex justify-between items-start gap-2'>
                            <div>
                                <Calendar
                                    mode='single'
                                    disabled={(date) => date < addDays(new Date(), 3)}
                                    selected={date}
                                    defaultMonth={date}
                                    onSelect={setDate}
                                    className='rounded-lg border w-[293px]'
                                />
                            </div>
                            <div className='grid grid-cols-3 gap-4 flex-1 pr-2 pl-4'>
                                <HourSlot startTime='21:00' endTime={'22:00'} disabled />
                                <HourSlot startTime='21:00' endTime={'22:00'} selected />
                                <HourSlot startTime='21:00' endTime={'22:00'} />
                            </div>
                        </div>
                    </FormCard>
                </div>
            </div>
        </div>
    );
}
