import Link from 'next/link';

interface IHeaderNavigationAnchor {
    href: string;
    children: React.ReactNode;
    target?: '_blank' | '_self';
}

// TODO: 현재 네비게이션에서만 쓰이고 있어서 컴포넌트 이름을 일반화하지 않은 상태입니다.
// 같은 스타일링을 다른 곳에서 사용할 때 꼭 컴포넌트 이름을 일반화해서 사용해주세요.
export function HeaderNavigationAnchor({
    href,
    children,
    target = '_self',
}: IHeaderNavigationAnchor) {
    return (
        <Link href={href} className='text-base font-semibold' target={target}>
            {children}
        </Link>
    );
}
