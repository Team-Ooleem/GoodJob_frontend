import { api } from './api';

// ===== 타입 정의 =====
export interface CreateCoachingCanvasRequest {
    name: string;
    participantId: number;
}

export interface CreateCoachingCanvasResponse {
    id: number;
    name: string;
    created_by: number;
    participants: number[];
}

// ===== API 서비스 클래스 =====
export class CoachingResumeApi {
    /**
     * 이력서 코칭 캔버스 생성 및 참여자 초대
     */
    static async createCoachingCanvas(
        data: CreateCoachingCanvasRequest,
    ): Promise<CreateCoachingCanvasResponse> {
        const response = await api.post<CreateCoachingCanvasResponse>(
            '/coaching-resume/canvas',
            data,
        );
        return response.data;
    }
}
