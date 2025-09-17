'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSessionStore } from '../_stores';
import { useCoachingResumeCanvas } from '../_hooks';
import {
    FabricToolbar,
    FabricCanvas,
    RecordingListPopup,
    SocketProvider,
    WaitingRoom,
    CanvasHeader,
} from '../_components';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function CoachingResumePage() {
    const { sessionId } = useParams<{ sessionId: string }>();
    const router = useRouter();
    const sessionStarted = useSessionStore((s) => s.sessionStarted);
    const setRole = useSessionStore((s) => s.setRole);
    const setMentorName = useSessionStore((s) => s.setMentorName);
    const setMenteeName = useSessionStore((s) => s.setMenteeName);
    const [showAccessDeniedAlert, setShowAccessDeniedAlert] = useState(true);

    const { data: canvasData, isError, isLoading } = useCoachingResumeCanvas(sessionId);

    useEffect(() => {
        if (canvasData) {
            setRole(canvasData.role);
            setMentorName(canvasData.mentor?.name || '');
            setMenteeName(canvasData.mentee?.name || '');
        }
    }, [canvasData, setRole, setMentorName, setMenteeName]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return (
            <AlertDialog open={showAccessDeniedAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>접근 권한이 없습니다</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 코칭 세션에 참여할 권한이 없습니다. 이전 페이지로 돌아갑니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => {
                                setShowAccessDeniedAlert(false);
                                router.back();
                            }}
                        >
                            확인
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    if (!sessionStarted) {
        return (
            <>
                <SocketProvider />
                <WaitingRoom />
            </>
        );
    }

    return (
        <>
            <SocketProvider />
            <CanvasHeader
                title={canvasData?.name || '코칭 세션'}
                onExit={() => console.log('나가기')}
            />
            <FabricToolbar />
            <FabricCanvas
                mentorName={canvasData?.mentor?.name}
                menteeName={canvasData?.mentee?.name}
            />
            <RecordingListPopup />
        </>
    );
}
