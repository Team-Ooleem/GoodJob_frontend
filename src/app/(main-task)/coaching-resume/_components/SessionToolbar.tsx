'use client';

type Props = {
    onExit?: () => void;
};

export function SessionToolbar({ onExit }: Props) {
    return (
        <div className='absolute top-5 right-4 z-[10] bg-red-500 hover:bg-red-700 active:bg-red-800 shadow-[0_2px_6px_rgba(0,0,0,0.25)] rounded-full px-3 py-2 flex items-center gap-2'>
            <button
                type='button'
                className='px-3 py-1 rounded-ful text-white text-sm font-bold transition-colors'
                onClick={onExit}
            >
                나가기
            </button>
        </div>
    );
}
