'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MentoringProductForm from './_components/MentoringProductForm';
import {
    createMentoringProduct,
    fetchJobCategories,
    CreateMentoringProductRequest,
    JobCategory,
} from '@/app/admin/_apis/mentoring-product-api';

export default function AdminProductCreationPage() {
    const router = useRouter();
    const [jobCategories, setJobCategories] = useState<JobCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 초기 데이터 로드
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const categoriesData = await fetchJobCategories();
                setJobCategories(categoriesData);
            } catch (error) {
                console.error('초기 데이터 로드 실패:', error);
                setAlert({ type: 'error', message: '데이터를 불러오는데 실패했습니다.' });
            } finally {
                setIsDataLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const handleSubmit = async (data: CreateMentoringProductRequest) => {
        setIsLoading(true);
        setAlert(null);
        try {
            const response = await createMentoringProduct(data);

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

    if (isDataLoading) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
                    <p className='mt-2 text-gray-600'>데이터를 불러오는 중...</p>
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
