import { Flex, Button } from 'antd';

export function FabricToolbar() {
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
