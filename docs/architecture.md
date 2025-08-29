# 🏗️ 프로젝트 아키텍처 가이드

이 문서는 Next.js 프로젝트에서 사용되는 폴더 구조와 각 폴더의 역할에 대해 설명합니다.

## 목차

- [폴더 구조 개요](#폴더-구조-개요)
- [App Router 구조](#app-router-구조)
- [동적 라우팅](#동적-라우팅)
- [폴더 명명 규칙](#폴더-명명-규칙)

## 폴더 구조 개요

```
src/
├── app/                 # App Router (Next.js 13+)
├── components/          # 재사용 가능한 UI 컴포넌트
├── constants/           # 상수 및 설정값
├── hooks/              # 커스텀 React 훅
├── types/              # TypeScript 타입 정의
├── utils/              # 헬퍼 함수들
├── providers/          # Context Provider 컴포넌트
├── apis/               # API 관련 함수들
```

## App Router 구조

Next.js 13+ App Router는 폴더 기반 라우팅 시스템을 사용합니다:

```
src/app/
├── page.tsx            # 홈페이지 (/)
├── layout.tsx          # 루트 레이아웃
├── globals.css         # 전역 스타일
├── users/              # /users 경로
│   ├── page.tsx        # /users 페이지
│   ├── layout.tsx      # users 레이아웃
│   └── [id]/           # 동적 라우팅
│       ├── page.tsx    # /users/[id] 페이지
│       └── edit/       # /users/[id]/edit 경로
│           └── page.tsx
├── blog/               # /blog 경로
│   ├── page.tsx        # /blog 페이지
│   └── [slug]/         # 동적 라우팅
│       └── page.tsx    # /blog/[slug] 페이지
```

## 동적 라우팅

### 1. 동적 세그먼트 `[id]`

폴더명을 대괄호로 감싸면 동적 라우팅이 됩니다:

```
app/users/[id]/page.tsx
```

```typescript
// app/users/[id]/page.tsx
interface UserPageProps {
  params: {
    id: string;
  };
}

export default function UserPage({ params }: UserPageProps) {
  return <div>사용자 ID: {params.id}</div>;
}
```

### 2. 다중 동적 세그먼트

여러 동적 세그먼트를 사용할 수 있습니다:

```
app/shop/[category]/[product]/page.tsx
```

```typescript
// app/shop/[category]/[product]/page.tsx
interface ProductPageProps {
  params: {
    category: string;
    product: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div>
      카테고리: {params.category}, 제품: {params.product}
    </div>
  );
}
```

### 3. Catch-all 세그먼트 `[...slug]`

모든 하위 경로를 캐치합니다:

```
app/blog/[...slug]/page.tsx
```

```typescript
// app/blog/[...slug]/page.tsx
interface BlogPageProps {
  params: {
    slug: string[]; // 배열로 받음
  };
}

export default function BlogPage({ params }: BlogPageProps) {
  return (
    <div>
      경로: {params.slug.join('/')}
    </div>
  );
}
```

### 4. Optional Catch-all 세그먼트 `[[...slug]]`

선택적 catch-all 세그먼트입니다:

```
app/docs/[[...slug]]/page.tsx
```

```typescript
// app/docs/[[...slug]]/page.tsx
interface DocsPageProps {
  params: {
    slug?: string[]; // 선택적 배열
  };
}

export default function DocsPage({ params }: DocsPageProps) {
  if (!params.slug) {
    return <div>문서 홈페이지</div>;
  }

  return (
    <div>
      문서 경로: {params.slug.join('/')}
    </div>
  );
}
```

## 폴더 명명 규칙

전역으로 사용되지 않는 함수들은 app 폴더 내부의 page.tsx와 같은 위치에 \_ 을 붙여서 폴더를 생성하세요.

```
src/
├── app/                # App Router (Next.js 13+)
├────── users/          # userpage
├───────── _components/ # 이렇게
```

### 특수 폴더명

- `(grouping)`: 그룹화용 폴더 (URL에 영향을 주지 않음)
- `_components`: 컴포넌트 폴더 (라우팅에서 제외)
- `_lib`: 라이브러리 폴더 (라우팅에서 제외)
- `_utils`: 유틸리티 폴더 (라우팅에서 제외)

### 그룹화 예시

```
app/
├── (marketing)/        # 마케팅 관련 페이지 그룹
│   ├── about/
│   └── contact/
├── (shop)/            # 쇼핑 관련 페이지 그룹
│   ├── products/
│   └── cart/
└── layout.tsx         # 공통 레이아웃
```

이렇게 하면 URL은 `/about`, `/contact`, `/products`, `/cart`가 되고, `(marketing)`, `(shop)`은 URL에 포함되지 않습니다.
