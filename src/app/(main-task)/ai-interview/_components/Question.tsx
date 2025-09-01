import { Flex } from 'antd';

export function Question() {
    return (
        <Flex
            className='w-[calc(100%-18rem)] h-[266px] bg-white absolute bottom-0 left-1/2 -translate-x-1/2 rounded-tl-2xl rounded-tr-2xl text-3xl font-bold'
            vertical={true}
            justify='center'
            align='center'
        >
            <p>울림님, 안녕하세요.</p>
            <p>이번 면접을 진행하게 될 장병규입니다. 만나서 반갑습니다. 그럼,</p>
            <p>면접을 시작할까요?</p>
        </Flex>
    );
}
