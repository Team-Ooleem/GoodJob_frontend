'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';

interface CanvasHeaderProps {
    title: string;
    onExit: () => void;
}

export function CanvasHeader({ title, onExit }: CanvasHeaderProps) {
    return (
        <div className='w-full h-auto'>
            <div className='mx-auto max-w-full w-full px-4 md:px-6 h-[60px] flex justify-between items-center'>
                <h1 className='text-lg font-semibold'>{title}</h1>
                <Button
                    variant='ghost'
                    size='icon'
                    onClick={onExit}
                    className='group hover:bg-foreground'
                >
                    <X className='h-5 w-5 group-hover:text-background' />
                </Button>
            </div>
            <Separator />
        </div>
    );
}
