// =============example=============
export interface User {
    id: string;
    name: string;
    email: string;
}
// =============example=============

// =============Job Types=============
// 기본 데이터 구조
export interface JobCategory {
    id: number; // 직군 ID (예: 1, 2, 3...)
    name: string; // 직군명 (예: "IT개발·데이터")
}

export interface JobRole {
    id: number; // 직무 ID (예: 84, 101...)
    name: string; // 직무명 (예: "백엔드/서버개발")
}

export interface JobCategoriesResponse {
    success: boolean;
    data: {
        categories: JobCategory[];
    };
}

export interface JobRolesResponse {
    success: boolean;
    data: {
        roles: JobRole[];
    };
}

// 사용자 직군/직무 선호도 관련 타입
export interface UserJobPreference {
    categoryId: number;
    roleId: number;
}

export interface UserJobPreferenceResponse {
    success: boolean;
    message: string;
    data?: {
        categoryId: number;
        roleId: number;
    };
}

export interface ApiErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
    };
}
// =============Job Types=============

// =============Location Types=============
export interface Sido {
    sido_code: string;
    sido_name: string;
}

export interface Gu {
    gu_code: string;
    gu_name: string;
}

export interface SidoResponse {
    success: boolean;
    data: {
        sido: Sido[];
    };
}

export interface GuResponse {
    success: boolean;
    data: {
        gu: Gu[];
    };
}

export interface LocationGroup {
    sido_code: string;
    sido_name: string;
    gu: Gu[];
}

export interface AllLocationsResponse {
    success: boolean;
    data: {
        locations: LocationGroup[];
    };
}

// 사용자 희망 근무지 선호도 관련 타입
export interface UserLocationPreference {
    sidoCode: string;
    guCode: string;
}

export interface UserLocationPreferenceResponse {
    success: boolean;
    message: string;
    data?: {
        sidoCode: string;
        guCode: string;
    };
}
// =============Location Types=============

// =============Salary Types=============
export interface SalaryRange {
    id: number;
    min_salary: number | null;
    max_salary: number | null;
    display_text: string;
}

export interface SalaryRangesResponse {
    success: boolean;
    data: {
        salary_ranges: SalaryRange[];
    };
}

export interface SalaryRangeResponse {
    success: boolean;
    data: {
        salary_range: SalaryRange;
    };
}

export interface SalarySearchResponse {
    success: boolean;
    data: {
        salary_ranges: SalaryRange[];
    };
}

// 사용자 희망 연봉 선호도 관련 타입
export interface UserSalaryPreference {
    salaryRangeId: number;
}

export interface UserSalaryPreferenceResponse {
    success: boolean;
    message: string;
    data?: {
        salaryRangeId: number;
    };
}
// =============Salary Types=============

// =============Profile Types=============
export interface Profile {
    short_bio: string;
    bio: string;
}

export interface ProfileResponse {
    success: boolean;
    data: {
        profile: Profile;
    };
}

export interface ProfileUpdateRequest {
    short_bio: string;
    bio: string;
}

export interface ProfileUpdateResponse {
    success: boolean;
    message?: string;
}
// =============Profile Types=============
