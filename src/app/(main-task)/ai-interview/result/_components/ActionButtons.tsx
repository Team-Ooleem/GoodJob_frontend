// result/_components/ActionButtons.tsx
'use client';

import { Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function ActionButtons() {
    return (
        <div className='text-center mt-8'>
            <Space size='large'>
                <Link href='/'>
                    <Button size='large' icon={<ArrowLeftOutlined />}>
                        메인으로 돌아가기
                    </Button>
                </Link>
                <Link href='/ai-interview/select'>
                    <Button type='primary' size='large'>
                        다시 면접하기
                    </Button>
                </Link>
            </Space>
        </div>
    );
}
