'use client';

import { Button } from 'antd';

type Props = {
    onExit?: () => void;
};

export function SessionToolbar({ onExit }: Props) {
    return (
        <div className='absolute top-5 right-4 z-[10]'>
            <Button type='primary' variant='solid' danger>
                나가기
            </Button>
        </div>
    );
}
