import { useMutation } from '@tanstack/react-query';
import {
    analyzeInterview,
    InterviewAnalysisRequest,
    InterviewAnalysisResponse,
} from '../apis/interview-api';

export const useInterviewAnalysis = () => {
    return useMutation<InterviewAnalysisResponse, Error, InterviewAnalysisRequest>({
        mutationFn: analyzeInterview,
        onSuccess: (data) => {
            console.log('✅ 면접 분석 성공:', data);
        },
        onError: (error) => {
            console.error('❌ 면접 분석 실패:', error);
        },
    });
};
