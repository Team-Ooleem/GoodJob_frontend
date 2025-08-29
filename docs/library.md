# 📦 라이브러리 가이드

이 문서는 Good Job 프로젝트에서 사용하는 주요 라이브러리들과 그 역할에 대해 설명합니다.

## 목차

- [상태 관리 & 데이터 페칭](#상태-관리--데이터-페칭)
- [UI 컴포넌트 & 스타일링](#ui-컴포넌트--스타일링)
- [폼 관리](#폼-관리)
- [유효성 검사](#유효성-검사)
- [아이콘 & 이미지](#아이콘--이미지)
- [개발 도구](#개발-도구)
- [기타 유틸리티](#기타-유틸리티)

## 상태 관리 & 데이터 페칭

### @tanstack/react-query

**버전**: ^5.85.5  
**설치**: `pnpm add @tanstack/react-query`

**역할**: 서버 상태 관리 및 데이터 페칭을 위한 강력한 라이브러리

**주요 기능**:

- 자동 캐싱 및 백그라운드 업데이트
- 에러 핸들링 및 재시도 로직
- 낙관적 업데이트
- 무한 스크롤 및 페이지네이션 지원

**프로젝트에서의 활용**:

- AI 모의면접 세션 데이터 관리
- 이력서 정보 및 사용자 프로필 데이터 페칭
- 면접 질문 목록 및 히스토리 관리

### @tanstack/react-query-devtools

**버전**: ^4.40.1  
**설치**: `pnpm add @tanstack/react-query-devtools`

**역할**: React Query의 개발 도구로, 쿼리 상태를 시각적으로 모니터링하고 디버깅

**주요 기능**:

- 모든 쿼리와 뮤테이션의 실시간 상태 모니터링
- 캐시 데이터 검사 및 수정
- 쿼리 실행 시간 및 성능 분석
- 네트워크 요청 로그 확인

**프로젝트에서의 활용**:

- 개발 환경에서 React Query 상태 디버깅
- API 호출 성능 최적화
- 캐시 동작 방식 이해 및 문제 해결

### zustand

**버전**: ^5.0.8  
**설치**: `pnpm add zustand`

**역할**: 경량화된 클라이언트 상태 관리 라이브러리

**주요 기능**:

- 간단한 API와 작은 번들 크기
- TypeScript 우선 설계
- React 외부에서도 사용 가능
- 미들웨어 지원

**프로젝트에서의 활용**:

- 사용자 인증 상태 관리
- UI 상태 관리 (모달, 사이드바 등)
- 전역 설정 및 테마 관리

### axios

**버전**: ^1.11.0  
**설치**: `pnpm add axios`

**역할**: Promise 기반 HTTP 클라이언트 라이브러리

**주요 기능**:

- 브라우저와 Node.js 환경 모두 지원
- 요청/응답 인터셉터
- 자동 JSON 데이터 변환
- 요청 취소 및 타임아웃 설정
- 에러 핸들링 및 재시도 로직

**프로젝트에서의 활용**:

- AI 모의면접 API 호출
- 사용자 인증 및 프로필 관리 API
- 이력서 및 채용공고 데이터 페칭
- React Query와 연동하여 서버 상태 관리

## UI 컴포넌트 & 스타일링

### @tailwindcss/postcss

**버전**: ^4  
**설치**: `pnpm add @tailwindcss/postcss`

**역할**: Tailwind CSS v4의 PostCSS 플러그인

**주요 기능**:

- CSS 변수 기반 디자인 시스템
- PostCSS 파이프라인 통합
- 향상된 성능과 최적화

### tailwindcss

**버전**: ^4  
**설치**: `pnpm add tailwindcss`

**역할**: 유틸리티 우선 CSS 프레임워크

**주요 기능**:

- 빠른 UI 개발을 위한 유틸리티 클래스
- 반응형 디자인 지원
- 커스터마이징 가능한 디자인 시스템
- JIT(Just-In-Time) 컴파일러

## 폼 관리

### react-hook-form

**버전**: ^7.62.0  
**설치**: `pnpm add react-hook-form`

**역할**: 고성능 폼 상태 관리 및 유효성 검사

**주요 기능**:

- 제어/비제어 컴포넌트 지원
- 실시간 유효성 검사
- 폼 상태 최적화
- 에러 핸들링

**프로젝트에서의 활용**:

- 이력서 작성 폼
- 면접 응답 입력 폼
- 사용자 프로필 편집 폼

### @hookform/resolvers

**버전**: ^3.3.0  
**설치**: `pnpm add @hookform/resolvers`

**역할**: react-hook-form과 zod를 연동하여 스키마 검증

## 유효성 검사

### zod

**버전**: ^4.1.3  
**설치**: `pnpm add zod`

**역할**: TypeScript 우선 스키마 검증 라이브러리

**주요 기능**:

- 런타임 타입 검증
- 자동 TypeScript 타입 추론
- 복잡한 스키마 구성
- 에러 메시지 커스터마이징

**프로젝트에서의 활용**:

- API 요청/응답 데이터 검증
- 폼 입력값 검증
- 환경 변수 검증

## 아이콘 & 이미지

### next/image

**버전**: Next.js 내장  
**설치**: 별도 설치 불필요

**역할**: Next.js 최적화된 이미지 컴포넌트

**주요 기능**:

- 자동 이미지 최적화
- 지연 로딩
- 반응형 이미지
- WebP 등 최신 포맷 지원

## 개발 도구

### @types/node

**버전**: ^20  
**역할**: Node.js 타입 정의

### @types/react

**버전**: ^19  
**설치**: `pnpm add -D @types/react`

**역할**: React 타입 정의

### @types/react-dom

**버전**: ^19  
**설치**: `pnpm add -D @types/react-dom`

**역할**: React DOM 타입 정의

### eslint

**버전**: ^9  
**설치**: `pnpm add -D eslint`

**역할**: 코드 품질 및 스타일 검사

**설정 파일**: `eslint.config.mjs`

### @eslint/eslintrc

**버전**: ^3  
**설치**: `pnpm add -D @eslint/eslintrc`

**역할**: ESLint 설정 파일 호환성 레거시 지원

### @typescript-eslint/eslint-plugin

**버전**: ^8.31.1  
**설치**: `pnpm add -D @typescript-eslint/eslint-plugin`

**역할**: TypeScript 코드를 위한 ESLint 규칙

### @typescript-eslint/parser

**버전**: ^8.31.1  
**설치**: `pnpm add -D @typescript-eslint/parser`

**역할**: TypeScript 코드 파싱을 위한 ESLint 파서

### eslint-config-next

**버전**: 15.5.2  
**설치**: `pnpm add -D eslint-config-next`

**역할**: Next.js 프로젝트를 위한 ESLint 설정

### eslint-config-prettier

**버전**: ^9.1.2  
**설치**: `pnpm add -D eslint-config-prettier`

**역할**: ESLint와 Prettier 간의 충돌 방지

### prettier

**버전**: ^3.0.0  
**설치**: `pnpm add -D prettier`

**역할**: 코드 포맷팅

**설정 파일**: `.prettierrc`

### prettier-eslint

**버전**: ^16.1.2  
**설치**: `pnpm add -D prettier-eslint`

**역할**: Prettier와 ESLint를 통합하여 코드 포맷팅 및 검사

### typescript

**버전**: ^5  
**설치**: `pnpm add -D typescript`

**역할**: 정적 타입 검사를 지원하는 JavaScript 상위 집합

### only-allow

**버전**: ^1.2.1  
**설치**: `pnpm add -D only-allow`

**역할**: 특정 패키지 매니저만 사용하도록 강제

**프로젝트에서의 활용**:

- pnpm 사용 강제
- 팀 내 일관된 패키지 매니저 사용 보장

## 버전 관리

프로젝트의 안정성을 위해 주요 라이브러리는 LTS 버전을 사용합니다.
정기적으로 `pnpm outdated` 명령어로 업데이트 가능한 라이브러리를 확인하고,
필요시 업데이트를 진행합니다.
