'use client';

import { useState } from 'react';
import { Button } from 'antd';
import { ReplayChat } from './ReplayChat';

interface ReplayButtonProps {
    canvasIdx: number;
}

export function ReplayButton({ canvasIdx }: ReplayButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button type='default' onClick={() => setIsOpen((prev) => !prev)}>
                다시보기 리스트
            </Button>
            <ReplayChat canvasIdx={canvasIdx} isOpen={isOpen} />
        </>
    );
}
