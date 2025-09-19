'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { stopRecording } from '../_hooks/useVoiceRecorder';

interface CanvasHeaderProps {
    title: string;
    onExit?: () => void;
}

export function CanvasHeader({ title, onExit }: CanvasHeaderProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    const handleExit = async () => {
        if (onExit) {
            await stopRecording();
            onExit();
        } else {
            router.back();
        }
        setIsDialogOpen(false);
    };

    return (
        <>
            <div className='w-full h-auto'>
                <div className='mx-auto max-w-full w-full px-4 md:px-6 h-[60px] flex justify-between items-center'>
                    <h1 className='text-lg font-semibold'>{title}</h1>
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setIsDialogOpen(true)}
                        className='group hover:bg-foreground'
                    >
                        <X className='h-5 w-5 group-hover:text-background' />
                    </Button>
                </div>
                <Separator />
            </div>

            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>세션을 종료하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            현재 진행 중인 세션이 종료됩니다. 저장되지 않은 내용은 사라질 수
                            있습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDialogOpen(false)}>
                            취소
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleExit}>종료</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
