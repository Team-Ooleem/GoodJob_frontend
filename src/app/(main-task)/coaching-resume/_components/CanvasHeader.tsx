'use client';

import { useEffect, useState } from 'react';
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
    scheduledAt?: string; // ISO string for the scheduled start time
}

export function CanvasHeader({ title, onExit, scheduledAt }: CanvasHeaderProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();
    const [remaining, setRemaining] = useState<string>('');

    // Countdown: from scheduledAt time, 60:00 down to 00:00
    // If before start, show 60:00. If after +60m, show 00:00.
    useEffect(() => {
        if (!scheduledAt) {
            setRemaining('');
            return;
        }

        // DB 값(UTC) + 15시간 보정
        const start = new Date(scheduledAt).getTime() + 15 * 60 * 60 * 1000;

        const total = 60 * 60; // seconds

        const calc = () => {
            const now = Date.now();
            const diffSec = Math.floor((now - start) / 1000);
            let remain = total - diffSec;
            if (diffSec < 0) remain = total; // before start
            if (remain < 0) remain = 0; // after end
            const mm = String(Math.floor(remain / 60)).padStart(2, '0');
            const ss = String(remain % 60).padStart(2, '0');
            setRemaining(`${mm}:${ss}`);
        };

        calc();
        const id = setInterval(calc, 1000);
        return () => clearInterval(id);
    }, [scheduledAt]);

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
                    <div className='text-base font-mono tabular-nums text-foreground/80'>
                        {remaining}
                    </div>
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
