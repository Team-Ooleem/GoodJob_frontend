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

// =============Profile Types=============
export interface Profile {
    idx: number;
    name: string;
    phone: string;
    email: string;
    short_bio?: string;
    bio?: string;
    profile_img?: string;
    created_at: string;
    updated_at: string;
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
    profile_img?: string;
}

export interface ProfileUpdateResponse {
    success: boolean;
    message?: string;
}
// =============Profile Types=============
