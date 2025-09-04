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

export interface ApiErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
    };
}
// =============Job Types=============
