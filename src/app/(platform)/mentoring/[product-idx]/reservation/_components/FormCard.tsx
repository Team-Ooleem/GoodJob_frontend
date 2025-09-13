import { Separator } from '@/components/ui/separator';

interface IFormCard {
    title: string;
    children?: React.ReactNode;
    className?: string;
}

export function FormCard({ title, children, className }: IFormCard) {
    return (
        <div className={`border rounded-sm ${className}`}>
            <div className='p-4 bg-secondary'>
                <p className='text-sm font-bold'>{title}</p>
            </div>
            <Separator />
            <div className='p-4'>{children}</div>
        </div>
    );
}
