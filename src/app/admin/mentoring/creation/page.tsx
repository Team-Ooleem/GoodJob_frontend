'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import MentoringProductForm from './_components/MentoringProductForm';
import {
    createMentoringProduct,
    fetchJobCategories,
    CreateMentoringProductRequest,
    JobCategory,
} from '@/app/admin/_apis/mentoring-product-api';
import { fetchMyMentorIdx } from '@/app/admin/_apis/mentoring-application-api';

export default function AdminProductCreationPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
    const [mentorIdx, setMentorIdx] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 초기 데이터 로드
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 멘토 idx와 직무 카테고리를 병렬로 로드
                const [categoriesData, mentorData] = await Promise.all([
                    fetchJobCategories(),
                    fetchMyMentorIdx(),
                ]);

                setJobCategories(categoriesData);
                console.log('직무 카테고리 로드 성공:', categoriesData);

                if (mentorData.is_mentor && mentorData.mentor_idx) {
                    setMentorIdx(mentorData.mentor_idx);
                    console.log('멘토 idx 로드 성공:', mentorData.mentor_idx);
                } else {
                    setAlert({
                        type: 'error',
                        message: '멘토 권한이 없습니다. 멘토 등록 후 상품을 등록할 수 있습니다.',
                    });
                }
            } catch (error) {
                console.error('초기 데이터 로드 실패:', error);
                setAlert({
                    type: 'error',
                    message: '데이터를 불러오는 중 오류가 발생했습니다.',
                });
            } finally {
                setIsDataLoading(false);
            }
        };

        if (isAuthenticated) {
            loadInitialData();
        }
    }, [isAuthenticated]);

    const handleSubmit = async (data: CreateMentoringProductRequest) => {
        // 인증 확인
        if (!isAuthenticated || !user) {
            setAlert({ type: 'error', message: '로그인이 필요합니다.' });
            return;
        }

        // 멘토 권한 확인
        if (!mentorIdx) {
            setAlert({
                type: 'error',
                message: '멘토 권한이 없습니다. 멘토 등록 후 상품을 등록할 수 있습니다.',
            });
            return;
        }

        setIsLoading(true);
        setAlert(null);
        try {
            // 실제 멘토 idx 사용
            const submitData: CreateMentoringProductRequest = {
                ...data,
                mentor_idx: mentorIdx,
            };

            const response = await createMentoringProduct(submitData);

            if (response.success) {
                setAlert({ type: 'success', message: '멘토링 상품이 성공적으로 등록되었습니다.' });
                setTimeout(() => {
                    router.push('/admin/mentoring');
                }, 2000);
            } else {
                setAlert({
                    type: 'error',
                    message: response.message || '상품 등록에 실패했습니다.',
                });
            }
        } catch (error) {
            console.error('상품 등록 실패:', error);
            setAlert({ type: 'error', message: '상품 등록 중 오류가 발생했습니다.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isDataLoading) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
                    <p className='mt-2 text-gray-600'>데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 인증되지 않은 경우
    if (!isAuthenticated) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <div className='text-center'>
                    <p className='text-red-500 text-lg'>로그인이 필요합니다.</p>
                    <button
                        onClick={() => router.push('/login')}
                        className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    >
                        로그인 페이지로 이동
                    </button>
                </div>
            </div>
        );
    }

    // 멘토 권한이 없는 경우
    if (!mentorIdx) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <div className='text-center'>
                    <p className='text-red-500 text-lg'>멘토 권한이 없습니다.</p>
                    <p className='text-gray-600 mt-2'>멘토 등록 후 상품을 등록할 수 있습니다.</p>
                    <button
                        onClick={() => router.push('/admin/mentoring')}
                        className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                    >
                        멘토링 관리로 이동
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8'>
            <div className='mb-8'>
                <h1 className='text-3xl font-bold text-gray-900'>멘토링 상품 등록</h1>
                <p className='text-gray-600 mt-2 text-lg'>새로운 멘토링 상품을 등록하세요</p>
            </div>

            {alert && (
                <div className='mb-8'>
                    <Alert
                        className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}
                    >
                        <AlertTitle>{alert.type === 'error' ? '오류' : '성공'}</AlertTitle>
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                </div>
            )}

            <div className='max-w-5xl mx-auto'>
                <MentoringProductForm
                    jobCategories={jobCategories}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
