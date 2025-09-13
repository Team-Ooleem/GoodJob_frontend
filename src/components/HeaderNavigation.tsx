import { Flex } from 'antd';

// global components
import { HeaderNavigationAnchor } from './HeaderNavigationAnchor';

export function HeaderNavigation() {
    return (
        <div className='flex justify-center items-center gap-10'>
            <HeaderNavigationAnchor href='/'>채용</HeaderNavigationAnchor>
            <HeaderNavigationAnchor href='/ai-interview'>AI 인터뷰</HeaderNavigationAnchor>
            <HeaderNavigationAnchor href='/coaching-resume'>이력서</HeaderNavigationAnchor>
            <HeaderNavigationAnchor href='/'>커뮤니티</HeaderNavigationAnchor>
        </div>
    );
}
