'use client';

import { List } from 'antd';
import Image from 'next/image';
import { RecordingItem } from '@/apis/Recording-api';

function RecordingList({
    items,
    loading,
    onSelectItem,
    onLoadMore,
}: {
    items: RecordingItem[];
    loading: boolean;
    onSelectItem: (item: RecordingItem) => void;
    onRecordingClick?: (item: RecordingItem) => void;
    onLoadMore: () => void;
}) {
    return (
        <div
            className='p-2 max-h-[400px] overflow-auto'
            onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
                    onLoadMore();
                }
            }}
        >
            <List
                size='small'
                itemLayout='horizontal'
                dataSource={items}
                renderItem={(item) => (
                    <List.Item
                        className='px-2 cursor-pointer hover:bg-slate-50 rounded'
                        onClick={() => onSelectItem(item)}
                    >
                        <div className='flex items-start gap-3 w-full py-1'>
                            <div className='w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0'>
                                <Image src='/assets/mic.svg' alt='mic' width={14} height={14} />
                            </div>
                            <div className='flex-1'>
                                <div className='text-slate-800 text-sm'>{item.title}</div>
                                <div className='text-[12px] text-slate-500'>{`${Math.floor(
                                    item.durationSec / 60,
                                )}:${String(item.durationSec % 60).padStart(
                                    2,
                                    '0',
                                )} • ${item.createdAt}`}</div>
                            </div>
                        </div>
                    </List.Item>
                )}
            />
            {loading && <div className='py-2 text-center text-xs text-slate-500'>불러오는 중…</div>}
        </div>
    );
}

export default RecordingList;
