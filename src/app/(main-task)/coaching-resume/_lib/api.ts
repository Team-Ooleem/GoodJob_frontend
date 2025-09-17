import { api } from '@/apis/api';

interface CoachingResumeCanvasResponse {
    canvas_id: string;
    name: string;
    created_by: number;
    created_at: string;
    role: 'mentor' | 'mentee';
    mentor: {
        user_id: number;
        name: string;
        profile_img: string;
        role: 'mentor';
    } | null;
    mentee: {
        user_id: number;
        name: string;
        profile_img: string;
        role: 'mentee';
    } | null;
}

export async function fetchCoachingResumeCanvas(
    canvasId: string,
): Promise<CoachingResumeCanvasResponse> {
    const response = await api.get(`/coaching-resume/${canvasId}`);
    return response.data;
}
