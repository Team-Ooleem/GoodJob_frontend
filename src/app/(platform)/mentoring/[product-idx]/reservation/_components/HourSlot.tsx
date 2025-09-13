import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IHourSlot {
    startTime: string;
    endTime: string;
    selected?: boolean;
    disabled?: boolean;
}

export function HourSlot({ startTime, endTime, selected = false, disabled = false }: IHourSlot) {
    return (
        <Button
            className={`w-auto text-sm ${selected ? 'font-semibold' : 'font-medium'}`}
            variant={selected ? 'default' : 'outline'}
            disabled={disabled}
        >
            {startTime}~{endTime}
            <Badge
                variant='secondary'
                className='text-[9px] min-w-5 rounded-full px-1 font-mono tabular-nums'
            >
                {disabled ? '1/1' : '0/1'}
            </Badge>
        </Button>
    );
}
