import { Flex } from 'antd';

// global components
import { HeaderNavigationAnchor } from './HeaderNavigationAnchor';

export function HeaderNavigation() {
    return (
        <div className='flex justify-center items-center gap-10'>
            <HeaderNavigationAnchor href='/'>홈</HeaderNavigationAnchor>
            <HeaderNavigationAnchor href='/ai-interview' target='_blank'>
                AI 인터뷰
            </HeaderNavigationAnchor>
            <HeaderNavigationAnchor href='/coaching-resume' target='_blank'>
                이력서
            </HeaderNavigationAnchor>
            <HeaderNavigationAnchor href='/social'>커뮤니티</HeaderNavigationAnchor>
        </div>
    );
}
