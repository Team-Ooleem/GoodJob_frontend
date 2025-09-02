import { Flex, Button } from 'antd';

export function FabricToolbar() {
    // TODO: 툴바 버튼 컴포넌트 분리 및 스타일링 필요
    return (
        <Flex
            className='absolute bottom-[10px] left-[50%] transform-x-[-50%]'
            justify='center'
            align='center'
            gap={20}
        >
            <Button>Pen</Button>
            <Button>Eraser</Button>
        </Flex>
    );
}
