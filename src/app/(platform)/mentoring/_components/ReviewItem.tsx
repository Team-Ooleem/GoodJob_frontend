import { StarRating } from '@/components/mentoring';
import { Separator } from '@/components/ui/separator';

type Props = {
    menteeName: string;
    rating: number;
    content: string;
    createdAt: string; // ISO string
};

function formatDateTimeKST(iso: string) {
    if (!iso) return '';
    const date = new Date(iso);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}. ${m}. ${d}. ${hh}:${mm}`;
}

export function ReviewItem({ menteeName, rating, content, createdAt }: Props) {
    return (
        <div className='pb-8 flex flex-col gap-3'>
            <p className='text-base text-foreground'>{formatDateTimeKST(createdAt)}</p>
            <div className='flex flex-col gap-1 pb-8'>
                <div className='flex justify-start items-center gap-1.5'>
                    <StarRating rating={rating} size={20} />
                    <span className='text-base'>{rating.toFixed(1)}</span>
                    <span className='text-sm text-muted-foreground'>· {menteeName}</span>
                </div>
                <p className='whitespace-pre-line text-base'>{content}</p>
            </div>
            <Separator />
        </div>
    );
}
