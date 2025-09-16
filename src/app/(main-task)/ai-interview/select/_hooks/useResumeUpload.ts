import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { resumeApi, ResumeFileItem } from '../_apis/resume-api';

export const useResumeUpload = () => {
    const [uploadedFile, setUploadedFile] = useState<ResumeFileItem | null>(null);

    // 파일 업로드 mutation
    const uploadMutation = useMutation({
        mutationFn: resumeApi.uploadResume,
        onSuccess: (data) => {
            // 업로드 성공 시 파일 정보 저장
            setUploadedFile({
                id: data.id,
                originalName: '', // 업로드 시에는 파일명만 저장
                url: '',
                size: 0,
                mimetype: 'application/pdf',
                hasSummary: false,
                parseStatus: 'none',
                createdAt: new Date().toISOString(),
            });
        },
        onError: (error) => {
            console.error('파일 업로드 실패:', error);
        },
    });

    // 파싱 상태
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState<Error | null>(null);

    // 파일 업로드 함수
    const uploadFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            throw new Error('PDF 파일만 업로드할 수 있습니다.');
        }
        return uploadMutation.mutateAsync(file);
    };

    // 파싱 시작 함수
    const startParsing = async (resumeId: string) => {
        setIsParsing(true);
        setParseError(null);

        try {
            const result = await resumeApi.parseResume(resumeId);

            // 파싱 성공 시 상태 업데이트
            setUploadedFile((prev) =>
                prev
                    ? {
                          ...prev,
                          parseStatus: 'done',
                      }
                    : null,
            );

            return result;
        } catch (error) {
            console.error('파싱 실패:', error);
            const errorObj = error instanceof Error ? error : new Error('파싱에 실패했습니다.');
            setParseError(errorObj);

            // 파싱 실패 시 상태 업데이트
            setUploadedFile((prev) =>
                prev
                    ? {
                          ...prev,
                          parseStatus: 'error',
                      }
                    : null,
            );

            throw errorObj;
        } finally {
            setIsParsing(false);
        }
    };

    // 파일 정보 초기화
    const clearFile = () => {
        setUploadedFile(null);
    };

    return {
        uploadedFile,
        uploadFile,
        startParsing,
        clearFile,
        isUploading: uploadMutation.isPending,
        isParsing,
        uploadError: uploadMutation.error,
        parseError,
    };
};
