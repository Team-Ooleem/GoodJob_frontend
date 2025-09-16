import { useMutation } from '@tanstack/react-query';
import {
    canvasApi,
    type CanvasImageUploadRequest,
    type CanvasImageUploadResponse,
} from '../_apis/canvas-api';

export const useCanvasImageUpload = () => {
    const mutation = useMutation<CanvasImageUploadResponse, unknown, CanvasImageUploadRequest>({
        mutationFn: canvasApi.uploadCanvasImage,
    });

    return {
        uploadCanvasImage: mutation.mutateAsync,
        isUploading: mutation.isPending,
        error: mutation.error,
        data: mutation.data,
    };
};

