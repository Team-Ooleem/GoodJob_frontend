import Image from 'next/image';
import { Flex, Button } from 'antd';

// global components
import { HeaderNavigation } from './HeaderNavigation';

export function Header() {
    return (
        <div className='w-full h-auto border-b-1 border-gray-200'>
            <div className='mx-auto w-[1400px] h-[60px] flex justify-between items-center'>
                <Flex justify='center' align='center' gap={70}>
                    <Image
                        src='/assets/good-job-logo.webp'
                        alt='올인원 채용 플랫폼 굿잡'
                        width={40}
                        height={40}
                    />
                    <HeaderNavigation />
                </Flex>
                <Flex justify='center' align='center' gap={6}>
                    <Button type='primary'>로그인</Button>
                    <Button>기업 서비스</Button>
                </Flex>
            </div>
        </div>
    );
}
