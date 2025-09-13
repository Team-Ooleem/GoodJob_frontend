'use client';

import { User } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

interface MentorIntroductionProps {
    introduction: string;
    businessName: string;
    preferredField: string;
}

export function MentorIntroduction({
    introduction,
    businessName,
    preferredField,
}: MentorIntroductionProps) {
    return (
        <div className='mb-16'>
            <div className='flex items-center gap-2 mb-4'>
                <h2 className='text-2xl font-semibold'>소개</h2>
            </div>
            <div className='space-y-4'>
                {/* 멘토 소개글 */}
                {introduction && (
                    <div className='prose prose-sm max-w-none'>
                        <MDEditor.Markdown
                            source={introduction}
                            style={{
                                backgroundColor: 'transparent',
                                color: 'inherit',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
