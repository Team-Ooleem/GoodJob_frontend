'use client';

import { useState } from 'react';
import { addDays } from 'date-fns';

import { ReservationTitle, FormCard, HourSlot, BuyCard } from './_components';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2Icon } from 'lucide-react';
import { useMentoringProduct, useMentoringProductSlots } from '../../_hooks/useMentoringProduct';

type Props = { params: { 'product-idx': string } };

export default function ReservationPage({ params }: Props) {
    const productId = params['product-idx'];
    const { data: product, isLoading, error } = useMentoringProduct(productId);
    const {
        data: slotsData,
        isLoading: slotsLoading,
        error: slotsError,
    } = useMentoringProductSlots(productId);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [selectedRegularSlotsIdx, setSelectedRegularSlotsIdx] = useState<number | null>(null);
    const [messageToMentor, setMessageToMentor] = useState<string>('');

    if (isLoading || slotsLoading) {
        return (
            <div className='w-full p-8'>
                <div className='w-[1140px] mx-auto'>로딩 중...</div>
            </div>
        );
    }

    if (error || slotsError) {
        return (
            <div className='w-full p-8'>
                <div className='w-[1140px] mx-auto text-red-500'>
                    오류: {error?.message || slotsError?.message}
                </div>
            </div>
        );
    }

    const getAvailableSlotsForDate = (selectedDate: Date) => {
        if (!slotsData?.slots) return [];
        const dayOfWeek = selectedDate.getDay();
        return slotsData.slots.filter((slot) => slot.day_of_week === dayOfWeek);
    };

    const isDateAvailable = (checkDate: Date) => {
        if (!slotsData?.slots) return false;
        const dayOfWeek = checkDate.getDay();
        return slotsData.slots.some((slot) => slot.day_of_week === dayOfWeek);
    };

    const availableSlots = date ? getAvailableSlotsForDate(date) : [];

    return (
        <div className='w-full p-8'>
            <div className='w-[1140px] mx-auto flex gap-5'>
                <div className='w-[830px]'>
                    <div className='mb-6'>
                        <h1 className='text-2xl font-bold mb-5'>멘토링 신청</h1>
                        <ReservationTitle
                            mentorName={product?.mentor?.name}
                            productTitle={product?.title}
                        />
                    </div>
                    <FormCard title='1. 일정 선택' className='mb-4'>
                        <p className='text-xs text-muted-foreground mb-1'>
                            신청일 기준 3일 뒤부터 선택할 수 있어요.
                        </p>
                        <div className='flex justify-between items-start gap-2'>
                            <div>
                                <Calendar
                                    mode='single'
                                    disabled={(date) =>
                                        date < addDays(new Date(), 3) || !isDateAvailable(date)
                                    }
                                    selected={date}
                                    defaultMonth={date}
                                    onSelect={setDate}
                                    className='rounded-lg border w-[293px]'
                                />
                            </div>
                            <div className='grid grid-cols-3 gap-4 flex-1 pr-2 pl-4'>
                                {date ? (
                                    availableSlots.length > 0 ? (
                                        availableSlots.map((slot) => {
                                            const [startTime, endTime] = slot.time_range.split('-');
                                            const slotKey = `${slot.day_of_week}-${slot.hour_slot}`;
                                            return (
                                                <HourSlot
                                                    key={slotKey}
                                                    startTime={startTime}
                                                    endTime={endTime}
                                                    selected={selectedSlot === slotKey}
                                                    onClick={() => {
                                                        setSelectedSlot(slotKey);
                                                        setSelectedRegularSlotsIdx(
                                                            slot.regular_slots_idx,
                                                        );
                                                    }}
                                                />
                                            );
                                        })
                                    ) : (
                                        <div className='col-span-3 text-center text-muted-foreground py-4'>
                                            선택한 날짜에 예약 가능한 시간이 없습니다.
                                        </div>
                                    )
                                ) : (
                                    <div className='col-span-3 text-center text-muted-foreground py-4'>
                                        날짜를 선택하세요.
                                    </div>
                                )}
                            </div>
                        </div>
                    </FormCard>
                    <FormCard title='2. 멘토에게 보낼 메시지' className='mb-4'>
                        <p className='text-xs text-muted-foreground mb-1'>
                            멘토링을 신청한 목적과 멘토링 진행에 도움이 될만한 정보를 작성해 주세요.
                        </p>
                        <Textarea
                            className='h-36'
                            placeholder='Q. 멘토링 목적이 무엇인가요?'
                            value={messageToMentor}
                            onChange={(e) => setMessageToMentor(e.target.value)}
                        />
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
                    <BuyCard
                        price={product?.price}
                        productTitle={product?.title}
                        productIdx={productId}
                        selectedDate={date}
                        selectedSlot={selectedSlot}
                        selectedRegularSlotsIdx={selectedRegularSlotsIdx}
                        mentorName={product?.mentor?.name}
                        messageToMentor={messageToMentor}
                    />
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
