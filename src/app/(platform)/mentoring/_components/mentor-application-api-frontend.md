# 멘토 지원 API 명세서 (프론트엔드용)

## 개요

멘토 지원과 관련된 API들을 제공합니다. 사용자가 멘토로 지원하고, 직무 카테고리를 조회하며, 지원 내역을 확인할 수 있습니다.

## Base URL

```
http://localhost:4000/api/mentor-applications
```

---

## API 엔드포인트

### 1. 멘토 지원하기

**POST** `/api/mentor-applications`

사용자가 멘토로 지원하는 API입니다.

#### Request Headers

```
Content-Type: application/json
```

#### Request Body

```json
{
    "contact_email": "mentor@example.com",
    "business_name": "홍길동",
    "contact_phone": "010-1234-5678",
    "preferred_field_id": 2,
    "introduction": "# 안녕하세요!\n\n저는 5년차 프론트엔드 개발자입니다.\n\n## 경력\n- 네이버 3년\n- 카카오 2년\n\n## 전문 분야\n- React, Vue.js\n- TypeScript\n- 웹 성능 최적화",
    "portfolio_link": "https://github.com/example"
}
```

#### Request Body Schema

| 필드명               | 타입   | 필수 | 설명                                |
| -------------------- | ------ | ---- | ----------------------------------- |
| `contact_email`      | string | ✅   | 연락받을 이메일                     |
| `business_name`      | string | ✅   | 실명 또는 닉네임 또는 사업체명      |
| `contact_phone`      | string | ✅   | 연락처                              |
| `preferred_field_id` | number | ✅   | 희망분야 (job_category의 id)        |
| `introduction`       | string | ✅   | 나를 소개하는 글 (마크다운 형식)    |
| `portfolio_link`     | string | ❌   | 나를 표현할 수 있는 링크 (선택사항) |

#### Response

##### 성공 응답 (200 OK)

```json
{
    "success": true,
    "message": "멘토가 되어주셔서 감사합니다. 다른 분들에게 경험을 공유해주세요.",
    "mentor_idx": 101
}
```

##### 이미 멘토인 경우 (200 OK)

```json
{
    "success": false,
    "message": "이미 경험을 나눠주고 계세요! 멘토링 상품을 등록하거나 관리해보세요.",
    "mentor_idx": 10
}
```

##### 실패 응답 (200 OK)

```json
{
    "success": false,
    "message": "멘토 지원 등록 중 오류가 발생했습니다."
}
```

#### Response Schema

| 필드명       | 타입    | 설명                                         |
| ------------ | ------- | -------------------------------------------- |
| `success`    | boolean | 멘토 지원 성공 여부                          |
| `message`    | string  | 응답 메시지                                  |
| `mentor_idx` | number  | 멘토 고유 ID (성공 시 또는 이미 멘토인 경우) |

---

### 2. 직무 카테고리 조회

**GET** `/api/mentor-applications/job-categories`

멘토 지원 시 선택할 수 있는 직무 카테고리 목록을 조회합니다.

#### Response

##### 성공 응답 (200 OK)

```json
{
    "categories": [
        {
            "id": 2,
            "name": "IT개발·데이터"
        },
        {
            "id": 3,
            "name": "인사·노무·HRD"
        },
        {
            "id": 4,
            "name": "상품기획·MD"
        },
        {
            "id": 5,
            "name": "마케팅·홍보·조사"
        },
        {
            "id": 6,
            "name": "디자인"
        },
        {
            "id": 7,
            "name": "기획·전략"
        },
        {
            "id": 8,
            "name": "교육"
        }
    ]
}
```

##### 빈 응답 (오류 시)

```json
{
    "categories": []
}
```

#### Response Schema

| 필드명              | 타입   | 설명               |
| ------------------- | ------ | ------------------ |
| `categories`        | array  | 직무 카테고리 목록 |
| `categories[].id`   | number | 카테고리 ID        |
| `categories[].name` | string | 카테고리명         |

---

## 프론트엔드 구현 예시

### 1. 멘토 지원하기 (JavaScript/TypeScript)

```typescript
// 멘토 지원 API 호출
const createMentorApplication = async (applicationData: {
    contact_email: string;
    business_name: string;
    contact_phone: string;
    preferred_field_id: number;
    introduction: string;
    portfolio_link?: string;
}) => {
    try {
        const response = await fetch('http://localhost:4000/api/mentor-applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(applicationData),
        });

        const result = await response.json();

        if (result.success) {
            console.log('멘토 지원 성공:', result.message);
            console.log('멘토 ID:', result.mentor_idx);
        } else {
            console.log('멘토 지원 실패:', result.message);
        }

        return result;
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
};

// 사용 예시
const applicationData = {
    contact_email: 'mentor@example.com',
    business_name: '홍길동',
    contact_phone: '010-1234-5678',
    preferred_field_id: 2,
    introduction: '# 안녕하세요!\n\n저는 5년차 프론트엔드 개발자입니다.',
    portfolio_link: 'https://github.com/example',
};

createMentorApplication(applicationData);
```

### 2. 직무 카테고리 조회 (JavaScript/TypeScript)

```typescript
// 직무 카테고리 조회 API 호출
const getJobCategories = async () => {
    try {
        const response = await fetch(
            'http://localhost:4000/api/mentor-applications/job-categories',
        );
        const result = await response.json();

        console.log('직무 카테고리:', result.categories);
        return result.categories;
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
};

// 사용 예시
getJobCategories().then((categories) => {
    // 카테고리 목록을 UI에 표시
    categories.forEach((category) => {
        console.log(`${category.id}: ${category.name}`);
    });
});
```

### 3. React Hook 예시

```typescript
import { useState, useEffect } from 'react';

// 멘토 지원 Hook
export const useMentorApplication = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createApplication = async (data: CreateMentorApplicationDto) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/mentor-applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            return result;
        } catch (err) {
            setError('멘토 지원 중 오류가 발생했습니다.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createApplication, loading, error };
};

// 직무 카테고리 Hook
export const useJobCategories = () => {
    const [categories, setCategories] = useState<JobCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/mentor-applications/job-categories');
                const result = await response.json();
                setCategories(result.categories);
            } catch (error) {
                console.error('카테고리 조회 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return { categories, loading };
};
```

### 4. React 컴포넌트 예시

```tsx
import React, { useState, useEffect } from 'react';

interface JobCategory {
    id: number;
    name: string;
}

interface MentorApplicationForm {
    contact_email: string;
    business_name: string;
    contact_phone: string;
    preferred_field_id: number;
    introduction: string;
    portfolio_link?: string;
}

const MentorApplicationPage: React.FC = () => {
    const [categories, setCategories] = useState<JobCategory[]>([]);
    const [formData, setFormData] = useState<MentorApplicationForm>({
        contact_email: '',
        business_name: '',
        contact_phone: '',
        preferred_field_id: 0,
        introduction: '',
        portfolio_link: '',
    });
    const [loading, setLoading] = useState(false);

    // 카테고리 조회
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/mentor-applications/job-categories');
                const result = await response.json();
                setCategories(result.categories);
            } catch (error) {
                console.error('카테고리 조회 실패:', error);
            }
        };
        fetchCategories();
    }, []);

    // 폼 제출
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/mentor-applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                alert('멘토 지원이 완료되었습니다!');
                // 성공 후 처리 (예: 페이지 이동)
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('멘토 지원 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>이메일</label>
                <input
                    type='email'
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    required
                />
            </div>

            <div>
                <label>이름/닉네임</label>
                <input
                    type='text'
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    required
                />
            </div>

            <div>
                <label>연락처</label>
                <input
                    type='tel'
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    required
                />
            </div>

            <div>
                <label>희망 분야</label>
                <select
                    value={formData.preferred_field_id}
                    onChange={(e) =>
                        setFormData({ ...formData, preferred_field_id: Number(e.target.value) })
                    }
                    required
                >
                    <option value={0}>분야를 선택해주세요</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label>자기소개</label>
                <textarea
                    value={formData.introduction}
                    onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                    rows={10}
                    placeholder='마크다운 형식으로 작성해주세요'
                    required
                />
            </div>

            <div>
                <label>포트폴리오 링크 (선택사항)</label>
                <input
                    type='url'
                    value={formData.portfolio_link}
                    onChange={(e) => setFormData({ ...formData, portfolio_link: e.target.value })}
                />
            </div>

            <button type='submit' disabled={loading}>
                {loading ? '제출 중...' : '멘토 지원하기'}
            </button>
        </form>
    );
};

export default MentorApplicationPage;
```

---

## 에러 응답

### 400 Bad Request

```json
{
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request"
}
```

### 500 Internal Server Error

```json
{
    "statusCode": 500,
    "message": "Internal server error"
}
```

---

## 주의사항

1. **마크다운 지원**: `introduction` 필드는 마크다운 형식으로 작성할 수 있습니다.
2. **포트폴리오 링크**: 선택사항이지만, GitHub, 포트폴리오 사이트 등의 링크를 제공하는 것을 권장합니다.
3. **직무 카테고리**: `preferred_field_id`는 반드시 유효한 `job_category`의 `id`여야 합니다.
4. **중복 지원**: 한 사용자는 한 번만 멘토로 지원할 수 있습니다. 이미 멘토인 경우 적절한 메시지가 반환됩니다.
5. **자동 승인**: 멘토 지원 시 자동으로 승인되어 바로 멘토링 상품을 등록할 수 있습니다.

---

## cURL 예시

### 1. 멘토 지원하기

```bash
curl -X POST http://localhost:4000/api/mentor-applications \
  -H "Content-Type: application/json" \
  -d '{
    "contact_email": "mentor@example.com",
    "business_name": "홍길동",
    "contact_phone": "010-1234-5678",
    "preferred_field_id": 2,
    "introduction": "# 안녕하세요!\n\n저는 5년차 프론트엔드 개발자입니다.",
    "portfolio_link": "https://github.com/example"
  }'
```

### 2. 직무 카테고리 조회

```bash
curl -X GET http://localhost:4000/api/mentor-applications/job-categories
```
