'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { TimeSlot } from '@/app/admin/_apis/mentoring-product-api';

interface TimeTableProps {
    timeSlots: TimeSlot[];
    onTimeSlotsChange: (slots: TimeSlot[]) => void;
}

const DAYS_OF_WEEK = [
    { value: 1, label: '월', fullLabel: '월요일' },
    { value: 2, label: '화', fullLabel: '화요일' },
    { value: 3, label: '수', fullLabel: '수요일' },
    { value: 4, label: '목', fullLabel: '목요일' },
    { value: 5, label: '금', fullLabel: '금요일' },
    { value: 6, label: '토', fullLabel: '토요일' },
    { value: 7, label: '일', fullLabel: '일요일' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type DragPoint = { day: number; hour: number } | null;
type DragMode = 'select' | 'deselect' | null;

export default function TimeTable({ timeSlots, onTimeSlotsChange }: TimeTableProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<DragPoint>(null);
    const [dragEnd, setDragEnd] = useState<DragPoint>(null);
    const [dragMode, setDragMode] = useState<DragMode>(null);
    const handledByDragRef = useRef(false);

    // 빠른 조회를 위해 Set으로 보관
    const slotSet = useMemo(() => {
        const s = new Set<string>();
        for (const t of timeSlots) s.add(`${t.day_of_week}-${t.hour_slot}`);
        return s;
    }, [timeSlots]);

    const isTimeSlotSelected = useCallback(
        (day: number, hour: number) => slotSet.has(`${day}-${hour}`),
        [slotSet],
    );

    const isDragAreaSelected = useCallback(
        (day: number, hour: number) => {
            if (!dragStart || !dragEnd) return false;
            const minDay = Math.min(dragStart.day, dragEnd.day);
            const maxDay = Math.max(dragStart.day, dragEnd.day);
            const minHour = Math.min(dragStart.hour, dragEnd.hour);
            const maxHour = Math.max(dragStart.hour, dragEnd.hour);
            return day >= minDay && day <= maxDay && hour >= minHour && hour <= maxHour;
        },
        [dragStart, dragEnd],
    );

    // 단일 클릭 토글 (드래그가 아닌 경우에도 동작)
    const toggleOne = useCallback(
        (day: number, hour: number) => {
            const key = `${day}-${hour}`;
            const next = new Set(slotSet);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            onTimeSlotsChange(
                Array.from(next).map((k) => {
                    const [d, h] = k.split('-').map(Number);
                    return { day_of_week: d, hour_slot: h } as TimeSlot;
                }),
            );
        },
        [slotSet, onTimeSlotsChange],
    );

    // 드래그 시작
    const handleMouseDown = (day: number, hour: number) => {
        handledByDragRef.current = true;
        setIsDragging(true);
        const selected = isTimeSlotSelected(day, hour);
        setDragMode(selected ? 'deselect' : 'select'); // 시작칸 상태로 모드 결정
        setDragStart({ day, hour });
        setDragEnd({ day, hour });
    };

    // 드래그 중
    const handleMouseEnter = (day: number, hour: number) => {
        if (isDragging) setDragEnd({ day, hour });
    };

    // 드래그 종료 - 범위 한 번에 반영
    const applyDragSelection = useCallback(() => {
        if (!(isDragging && dragStart && dragEnd && dragMode)) {
            // 드래그가 아니면 click에서 처리할 수 있도록 플래그 리셋
            handledByDragRef.current = false;
            return;
        }

        const minDay = Math.min(dragStart.day, dragEnd.day);
        const maxDay = Math.max(dragStart.day, dragEnd.day);
        const minHour = Math.min(dragStart.hour, dragEnd.hour);
        const maxHour = Math.max(dragStart.hour, dragEnd.hour);

        const next = new Set(slotSet);

        for (let day = minDay; day <= maxDay; day++) {
            for (let hour = minHour; hour <= maxHour; hour++) {
                const key = `${day}-${hour}`;
                if (dragMode === 'select') next.add(key);
                else if (dragMode === 'deselect') next.delete(key);
            }
        }

        onTimeSlotsChange(
            Array.from(next).map((k) => {
                const [d, h] = k.split('-').map(Number);
                return { day_of_week: d, hour_slot: h } as TimeSlot;
            }),
        );

        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        setDragMode(null);

        // 드래그 사이클 끝났으니 click에서 추가 토글하지 않게 유지
        // 다음 tick에서만 false로 내려 중복 토글 방지
        setTimeout(() => {
            handledByDragRef.current = false;
        }, 0);
    }, [isDragging, dragStart, dragEnd, dragMode, slotSet, onTimeSlotsChange]);

    const handleMouseUp = () => {
        applyDragSelection();
    };

    // 창 밖에서 마우스가 놓여도 드래그 종료되도록
    useEffect(() => {
        const onUp = () => applyDragSelection();
        if (isDragging) {
            window.addEventListener('mouseup', onUp);
            return () => window.removeEventListener('mouseup', onUp);
        }
    }, [isDragging, applyDragSelection]);

    const clearAllTimeSlots = () => onTimeSlotsChange([]);

    const selectedCount = timeSlots.length;

    return (
        <Card className='shadow-sm'>
            <CardHeader className='pb-4'>
                <div className='flex items-center justify-between'>
                    <CardTitle className='text-xl'>가능한 시간대 설정</CardTitle>
                    <div className='flex items-center gap-2'>
                        <Badge variant='secondary'>선택된 시간대: {selectedCount}개</Badge>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={clearAllTimeSlots}
                            disabled={selectedCount === 0}
                            className='text-red-500 hover:text-red-700'
                        >
                            <Trash2 className='h-4 w-4 mr-1' />
                            전체 삭제
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className='space-y-4'>
                    <div className='text-sm text-gray-600'>
                        드래그하여 시간대를 선택/해제하거나 클릭하여 개별 시간을 토글할 수 있습니다.
                    </div>

                    {/* 타임테이블 */}
                    <div className='border rounded-lg overflow-hidden select-none max-w-md mx-auto'>
                        {/* 헤더 */}
                        <div className='grid grid-cols-8 bg-gray-50 border-b'>
                            <div className='p-0.5 text-center text-[10px] font-medium text-gray-500'>
                                시간
                            </div>
                            {DAYS_OF_WEEK.map((day) => (
                                <div
                                    key={day.value}
                                    className='p-0.5 text-center text-[10px] font-medium text-gray-700'
                                >
                                    {day.label}
                                </div>
                            ))}
                        </div>

                        {/* 시간대 그리드 */}
                        <div>
                            {HOURS.map((hour) => (
                                <div
                                    key={hour}
                                    className='grid grid-cols-8 border-b last:border-b-0'
                                >
                                    {/* 시간 라벨 */}
                                    <div className='p-0.5 h-6 flex items-center justify-center text-[10px] text-gray-600 bg-gray-50 border-r'>
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>

                                    {DAYS_OF_WEEK.map((day) => {
                                        const selected = isTimeSlotSelected(day.value, hour);
                                        const inDrag = isDragAreaSelected(day.value, hour);

                                        const previewClass =
                                            inDrag && dragMode === 'select'
                                                ? 'bg-blue-200 text-blue-900'
                                                : inDrag && dragMode === 'deselect'
                                                  ? 'bg-gray-200 text-gray-800'
                                                  : '';

                                        return (
                                            <div
                                                key={`${day.value}-${hour}`}
                                                className={[
                                                    'p-0.5 h-6 text-[10px] leading-none flex items-center justify-center cursor-pointer transition-colors',
                                                    selected
                                                        ? 'bg-blue-500 text-white'
                                                        : 'hover:bg-gray-100',
                                                    previewClass,
                                                ].join(' ')}
                                                onMouseDown={() => handleMouseDown(day.value, hour)}
                                                onMouseEnter={() =>
                                                    handleMouseEnter(day.value, hour)
                                                }
                                                onMouseUp={handleMouseUp}
                                                onClick={(e) => {
                                                    if (handledByDragRef.current) return;
                                                    toggleOne(day.value, hour);
                                                }}
                                            >
                                                {selected ? '✓' : ''}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 선택된 시간대 요약 */}
                    {selectedCount > 0 && (
                        <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
                            <h4 className='text-sm font-medium text-blue-900 mb-2'>
                                선택된 시간대
                            </h4>
                            <div className='flex flex-wrap gap-1'>
                                {timeSlots.map((slot, index) => {
                                    const day = DAYS_OF_WEEK.find(
                                        (d) => d.value === slot.day_of_week,
                                    );
                                    return (
                                        <Badge key={index} variant='outline' className='text-xs'>
                                            {day?.fullLabel}{' '}
                                            {slot.hour_slot.toString().padStart(2, '0')}:00
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
