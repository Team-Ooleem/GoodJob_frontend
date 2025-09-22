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

export interface SessionStatusResponse {
    isCompleted: boolean;
    application_status: string;
    scheduled_at?: string;
    completed_at?: string;
}

// ===== API 서비스 클래스 =====
export class CoachingResumeApi {
    /**
     * 이력서 코칭 캔버스 생성 및 참여자 초대
     */
    static async checkSessionStatus(canvasId: string): Promise<SessionStatusResponse> {
        const response = await api.get<SessionStatusResponse>(
            `/coaching-resume/${canvasId}/status`,
        );
        return response.data;
    }
    static async completeSession(canvasId: string) {
        const response = await api.patch(`/coaching-resume/${canvasId}/complete`);
        return response.data;
    }
}
