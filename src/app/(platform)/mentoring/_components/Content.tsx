interface IContent {
    children?: React.ReactNode;
}

export function Content({ children }: IContent) {
    return (
        <div className='p-8'>
            <div className='w-[1140px] mx-auto flex justify-start items-start'>
                <div className='w-[700px]'>{children}</div>
            </div>
        </div>
    );
}
