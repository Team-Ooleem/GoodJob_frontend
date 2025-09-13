export function AdminHeader() {
    return (
        <header className='flex items-center justify-between h-16 px-4 border-b bg-white'>
            <div className='flex items-center gap-4'>
                <h1 className='text-lg font-semibold'>관리자 대시보드</h1>
            </div>
            <div className='flex items-center gap-2'>{/* 나중에 버튼들 추가할 공간 */}</div>
        </header>
    );
}
