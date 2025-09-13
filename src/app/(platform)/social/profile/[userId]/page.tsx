'use client';

import { Suspense } from 'react';
import { UserProfileLayout } from '../_components';

interface UserProfilePageProps {
    params: {
        userId: string;
    };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
    const { userId } = params;

    return (
        <div className='min-h-screen bg-background'>
            <div className='container mx-auto'>
                <Suspense
                    fallback={
                        <div className='flex justify-center items-center h-64'>
                            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                        </div>
                    }
                >
                    <UserProfileLayout userId={parseInt(userId)} />
                </Suspense>
            </div>
        </div>
    );
}
