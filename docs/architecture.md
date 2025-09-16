# 🏗️ 프로젝트 아키텍처 가이드

이 문서는 Next.js 프로젝트에서 사용되는 폴더 구조와 각 폴더의 역할에 대해 설명합니다.

## 목차

- [폴더 구조 개요](#폴더-구조-개요)
- [App Router 구조](#app-router-구조)
- [실제 프로젝트 구조](#실제-프로젝트-구조)
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

## 실제 프로젝트 구조

Good Job 프로젝트의 실제 App Router 구조는 다음과 같습니다:

```
src/app/
├── page.tsx                    # 홈페이지 (/)
├── layout.tsx                  # 루트 레이아웃
├── globals.css                 # 전역 스타일
├── favicon.ico                 # 파비콘
├── auth/
│   └── loading/
│       └── page.tsx            # 인증 로딩 페이지
├── admin/                      # 관리자 페이지 그룹
│   ├── page.tsx                # 관리자 대시보드
│   ├── mentoring/
│   │   ├── page.tsx            # 멘토링 관리
│   │   └── creation/
│   │       └── page.tsx        # 멘토링 생성
│   ├── reservation/
│   │   └── page.tsx            # 예약 관리
│   └── review/
│       └── page.tsx            # 리뷰 관리
├── (main-task)/                # 주요 기능 그룹
│   ├── ai-interview/
│   │   ├── _components/        # AI 면접 관련 컴포넌트
│   │   ├── page.tsx            # AI 면접 메인
│   │   ├── result/
│   │   │   └── page.tsx        # 면접 결과
│   │   ├── select/
│   │   │   └── page.tsx        # 면접 선택
│   │   ├── sessions/
│   │   │   └── page.tsx        # 면접 세션 목록
│   │   └── setting/
│   │       ├── page.tsx        # 면접 설정
│   │       └── page_old.tsx    # 구 버전 (백업)
│   └── coaching-resume/
│       ├── _components/        # 이력서 코칭 컴포넌트
│       ├── _hooks/             # 커스텀 훅들
│       ├── _stores/            # 상태 관리
│       ├── [sessionId]/        # 동적 세션 라우트
│       │   └── page.tsx
│       └── page.tsx            # 이력서 코칭 메인
├── (not-login)/                # 비로그인 사용자 그룹
│   ├── (onboarding)/           # 온보딩 프로세스
│   │   ├── job-selection/
│   │   │   └── page.tsx        # 직업 선택
│   │   ├── location-selection/
│   │   │   └── page.tsx        # 지역 선택
│   │   ├── profile-input/
│   │   │   └── page.tsx        # 프로필 입력
│   │   └── salary-selection/
│   │       └── page.tsx        # 급여 선택
│   ├── login/
│   │   └── page.tsx            # 로그인 페이지
│   ├── login-business/
│   │   └── page.tsx            # 기업 로그인
│   └── login-individual/
│       └── page.tsx            # 개인 로그인
└── (platform)/                 # 플랫폼 기능 그룹
    ├── layout.tsx              # 플랫폼 레이아웃
    ├── page.tsx                # 플랫폼 메인
    ├── mentoring/
    │   ├── [product-idx]/      # 동적 제품 라우트
    │   │   ├── page.tsx        # 제품 상세
    │   │   └── reservation/
    │   │       ├── page.tsx    # 예약 페이지
    │   │       ├── fail/
    │   │       │   └── page.tsx # 예약 실패
    │   │       └── success/
    │   │           └── page.tsx # 예약 성공
    │   └── page.tsx            # 멘토링 목록
    ├── my-page/
    │   ├── ai-interview-result/
    │   │   └── page.tsx        # AI 면접 결과
    │   └── coaching-resume-result/
    │       └── page.tsx        # 이력서 코칭 결과
    └── social/
        ├── _apis/              # 소셜 API
        ├── _components/        # 소셜 컴포넌트
        ├── _hooks/             # 소셜 훅들
        ├── _utils/             # 소셜 유틸리티
        ├── page.tsx            # 소셜 메인
        └── profile/
            └── [userId]/       # 사용자 프로필
                ├── _components/
                ├── _constants/
                ├── _hooks/
                ├── _utils/
                └── page.tsx
```

### 구조 분석 및 특징

#### 1. 그룹 라우팅 활용

- `(main-task)`, `(not-login)`, `(platform)`: 기능별로 페이지를 그룹화
- URL에는 영향 없이 코드 구조만 정리

#### 2. 기능별 모듈화

- 각 주요 기능(`ai-interview`, `coaching-resume`, `social`)마다 독립적인 구조
- `_components`, `_hooks`, `_stores`, `_apis`, `_utils` 등으로 세분화

#### 3. 동적 라우팅 활용

- `[sessionId]`: 세션별 페이지
- `[product-idx]`: 제품별 페이지
- `[userId]`: 사용자별 프로필 페이지

#### 4. 중첩 라우팅

- `coaching-resume/[sessionId]`: 세션별 이력서 코칭
- `mentoring/[product-idx]/reservation`: 제품별 예약 시스템

#### 5. 상태 관리 구조

- `_stores/`: Zustand 스토어
- `_hooks/`: 커스텀 React 훅
- `_utils/`: 유틸리티 함수
