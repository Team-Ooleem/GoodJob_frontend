# Good Job - AI 기반 채용플랫폼

## 🚀 주요 기능

### AI 모의면접

- 실시간 AI 면접관과 1:1 모의면접 진행
- 면접 질문 자동 생성 및 답변 분석
- 면접 성과 리포트 및 개선점 제안

### 이력서 코칭

- AI 기반 이력서 분석 및 피드백
- 직무별 맞춤형 이력서 작성 가이드
- 키워드 최적화 및 ATS 친화적 이력서 제작

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Nest.js
- **Database**: MySQL

## 📦 주요 라이브러리

프로젝트에서 사용하는 라이브러리들과 그 역할에 대한 상세한 정보는 [📚 라이브러리 가이드](./docs/library.md)를 참조하세요.

**주요 라이브러리**:

- **@tanstack/react-query**: 서버 상태 관리 및 데이터 페칭
- **react-hook-form**: 폼 상태 관리 및 유효성 검사
- **zod**: TypeScript 스키마 검증
- **@radix-ui/react-\***: 접근성 UI 컴포넌트
- **lucide-react**: 아이콘 세트

## 📋 개발 환경 설정

### 필수 외부 의존성 설치

프로젝트를 시작하기 전에 다음 도구들을 시스템에 설치해야 합니다:

#### 1. Node.js 설치 (nvm 사용)

**nvm 설치**:

- Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows) 다운로드 및 설치
- macOS/Linux:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

**Node.js 22.19.0 설치 및 사용**:

```bash
# Node.js 22.19.0 설치
nvm install 22.19.9

# 23.11.1 버전 사용
nvm use 22.19.0

# 기본 버전으로 설정
nvm alias default 22.19.0

# 설치 확인
node --version  # v22.19.0
npm --version   # npm 버전 확인
```

#### 2. pnpm 패키지 매니저 설치

```bash
npm install -g pnpm
```

- 설치 확인: `pnpm --version`

### 프로젝트 설정

1. 저장소 클론

```bash
git clone [나중에 업데이트 해야함]
cd good-job-next
```

2. 의존성 설치

```bash
pnpm install
```

3. 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local 파일에 필요한 API 키 및 설정값 입력
```

4. 개발 서버 실행

```bash
pnpm dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 📁 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
├── components/          # 재사용 가능한 컴포넌트
├── lib/                # 유틸리티 함수 및 설정
├── types/              # TypeScript 타입 정의
└── styles/             # 전역 스타일 및 CSS 모듈
```

## 🔧 개발 명령어

```bash
pnpm dev          # 개발 서버 실행
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버 실행
pnpm lint         # ESLint 검사
pnpm type-check   # TypeScript 타입 검사
```
