import { api } from '@/apis/api';

export interface CanvasImageUploadRequest {
    dataUrl: string;
    fileName: string;
}

export interface CanvasImageUploadResponse {
    url: string;
}

export const canvasApi = {
    uploadCanvasImage: async (
        payload: CanvasImageUploadRequest,
    ): Promise<CanvasImageUploadResponse> => {
        const res = await api.post('/coaching-resume/canvas/upload', payload);
        return res.data as CanvasImageUploadResponse;
    },
};
