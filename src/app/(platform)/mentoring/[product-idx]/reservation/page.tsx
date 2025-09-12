'use client';

import { useState } from 'react';
import { addDays } from 'date-fns';

import { ReservationTitle, FormCard, HourSlot, BuyCard } from './_components';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2Icon } from 'lucide-react';

export default function ReservationPage() {
    const [date, setDate] = useState<Date | undefined>(undefined);

    return (
        <div className='w-full p-8'>
            <div className='w-[1140px] mx-auto flex gap-5'>
                <div className='w-[830px]'>
                    <div className='mb-6'>
                        <h1 className='text-2xl font-bold mb-5'>멘토링 신청</h1>
                        <ReservationTitle />
                    </div>
                    <FormCard title='1. 일정 선택' className='mb-4'>
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
                    <FormCard title='2. 멘토에게 보낼 메시지' className='mb-4'>
                        <p className='text-xs text-muted-foreground mb-1'>
                            멘토링을 신청한 목적과 멘토링 진행에 도움이 될만한 정보를 작성해 주세요.
                        </p>
                        <Textarea className='h-36' placeholder='Q. 멘토링 목적이 무엇인가요?' />
                    </FormCard>
                    <Alert>
                        <CheckCircle2Icon size={15} />
                        <AlertTitle>멘토링은 멘토 확정 후 진행됩니다.</AlertTitle>
                        <AlertDescription>
                            신청 후 24시간 내로 멘토링 진행 여부를 확인할 수 있습니다. 진행이
                            확정되면, 멘토와 세부 일정 조율 후 진행됩니다.
                        </AlertDescription>
                    </Alert>
                </div>
                <div className='flex-1'>
                    <BuyCard />
                    <Alert className='mt-4'>
                        <AlertDescription>
                            멘토링 환불은 멘토링 시작 시간을 기준으로 진행되며, 120시간 전 환불시
                            전액 환불이 가능합니다.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        </div>
    );
}
