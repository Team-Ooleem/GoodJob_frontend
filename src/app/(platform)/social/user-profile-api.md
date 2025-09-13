# User Profile API 명세서

## 개요

사용자 프로필 정보를 조회하는 API입니다. 내 정보와 다른 사용자 정보를 구분하여 제공합니다.

## Base URL

```
http://localhost:4000/social/profile
```

## 인증

모든 API는 세션 쿠키를 통한 인증이 필요합니다.

---

## 1. 내 정보 조회

### `GET /me`

현재 로그인한 사용자의 프로필 정보를 조회합니다.

#### Request

```typescript
// Headers
{
  "Cookie": "session=your_session_cookie"
}
```

#### Response

```typescript
interface MyProfileInfo {
    name: string;
    profileImage?: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    totalPosts: number;
    totalLikes: number;
    joinDate: string;
    isMentor: boolean;
    mentorProfile?: {
        businessName: string;
        preferredField: string;
        isApproved: boolean;
        totalMentoringSessions: number;
        totalMentoringReviews: number;
        avgMentoringRating: number;
        totalMentoringApplications: number;
    };
}
```

#### 성공 응답 (200 OK)

```json
{
    "name": "홍길동",
    "profileImage": "https://example.com/profile.jpg",
    "bio": "개발자입니다",
    "followerCount": 123,
    "followingCount": 45,
    "totalPosts": 67,
    "totalLikes": 890,
    "joinDate": "2024-01-15T10:30:00Z",
    "isMentor": true,
    "mentorProfile": {
        "businessName": "테크컴퍼니",
        "preferredField": "IT/개발",
        "isApproved": true,
        "totalMentoringSessions": 15,
        "totalMentoringReviews": 12,
        "avgMentoringRating": 4.8,
        "totalMentoringApplications": 25
    }
}
```

#### 에러 응답

```json
// 404 Not Found
{
  "status": 404,
  "error": "사용자를 찾을 수 없습니다."
}

// 500 Internal Server Error
{
  "status": 500,
  "error": "내 정보 조회 실패: 서버 오류"
}
```

---

## 2. 다른 사용자 정보 조회

### `GET /:userId`

특정 사용자의 프로필 정보를 조회합니다.

#### Request

```typescript
// Headers
{
  "Cookie": "session=your_session_cookie"
}

// Path Parameters
{
  userId: number; // 조회할 사용자 ID
}
```

#### Response

```typescript
interface AnotherUserProfileInfo {
    name: string;
    profileImage?: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    totalPosts: number;
    totalLikes: number;
    joinDate: string;
    isFollowing?: boolean; // 현재 사용자가 이 사용자를 팔로우하고 있는지 여부
    isMentor: boolean;
    mentorProfile?: {
        businessName: string;
        preferredField: string;
        isApproved: boolean;
        totalMentoringSessions: number;
        totalMentoringReviews: number;
        avgMentoringRating: number;
        totalMentoringApplications: number;
    };
}
```

#### 성공 응답 (200 OK)

```json
{
    "name": "김멘토",
    "profileImage": "https://example.com/profile2.jpg",
    "bio": "시니어 개발자",
    "followerCount": 456,
    "followingCount": 78,
    "totalPosts": 123,
    "totalLikes": 2340,
    "joinDate": "2023-06-01T09:00:00Z",
    "isFollowing": true,
    "isMentor": true,
    "mentorProfile": {
        "businessName": "빅테크",
        "preferredField": "IT/개발",
        "isApproved": true,
        "totalMentoringSessions": 30,
        "totalMentoringReviews": 28,
        "avgMentoringRating": 4.9,
        "totalMentoringApplications": 50
    }
}
```

#### 에러 응답

```json
// 404 Not Found
{
  "status": 404,
  "error": "사용자를 찾을 수 없습니다."
}

// 500 Internal Server Error
{
  "status": 500,
  "error": "다른 사용자 정보 조회 실패: 서버 오류"
}
```

## 주의사항

1. **인증**: 모든 API는 세션 쿠키를 통한 인증이 필요합니다.
2. **캐싱**: React Query를 사용하여 5분간 캐시됩니다.
3. **에러 처리**: 404, 500 에러에 대한 적절한 처리가 필요합니다.
4. **멘토 정보**: `isMentor`가 `true`일 때만 `mentorProfile`이 존재합니다.
5. **팔로우 상태**: 다른 사용자 정보 조회 시에만 `isFollowing`이 포함됩니다.

---

## 변경사항

- **v2.0.0**: 내 정보와 다른 사용자 정보를 분리하여 최적화
- **v2.0.0**: 멘토 통계 정보 추가 (수강생 수, 수강평 수, 평점, 신청 수)
- **v2.0.0**: 기존 통합 API 제거, 각각의 용도에 맞는 API로 분리
