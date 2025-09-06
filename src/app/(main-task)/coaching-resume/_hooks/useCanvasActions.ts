import axios from 'axios';

export const useCanvasActions = () => {
    const deleteCanvas = async (canvasIdx: number) => {
        try {
            await axios.delete(`http://localhost:4000/api/stt/canvas/${canvasIdx}`);
            console.log('캔버스 삭제 완료');
        } catch (error) {
            console.error('캔버스 삭제 실패:', error);
        }
    };

    return { deleteCanvas };
};
