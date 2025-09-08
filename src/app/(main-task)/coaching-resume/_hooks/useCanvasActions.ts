import axios from 'axios';

import { API_BASE_URL } from '@/constants/config';

export const useCanvasActions = () => {
    const deleteCanvas = async (canvasIdx: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/stt/canvas/${canvasIdx}`);
            console.log('캔버스 삭제 완료');
        } catch (error) {
            console.error('캔버스 삭제 실패:', error);
        }
    };

    return { deleteCanvas };
};
