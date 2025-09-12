import { Separator } from '@/components/ui/separator';

export function Footer() {
    return (
        <footer className='w-full h-[130px]'>
            <Separator />
            <div className='mx-auto w-full max-w-[1300px] px-4 py-6'>
                <p className='text-sm'>ⓒ 2025 Team Ooleem</p>
            </div>
        </footer>
    );
}
