'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// 마크다운 에디터를 동적으로 로드 (SSR 방지)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export interface MarkdownEditorProps {
    value?: string;
    onChange?: (value?: string) => void;
    placeholder?: string;
    height?: number;
    className?: string;
    disabled?: boolean;
    dataColorMode?: 'light' | 'dark' | 'auto';
    preview?: 'edit' | 'live' | 'preview';
    visibleDragbar?: boolean;
}

const MarkdownEditor = React.forwardRef<HTMLDivElement, MarkdownEditorProps>(
    (
        {
            value = '',
            onChange,
            placeholder = '마크다운으로 작성해주세요...',
            height = 300,
            className,
            disabled = false,
            dataColorMode = 'auto',
            preview = 'live',
            visibleDragbar = false,
            ...props
        },
        ref,
    ) => {
        const { theme } = useTheme();

        // 테마에 따라 자동으로 색상 모드 결정
        const resolvedColorMode =
            dataColorMode === 'auto' ? (theme === 'dark' ? 'dark' : 'light') : dataColorMode;

        return (
            <div
                ref={ref}
                className={cn(
                    'border rounded-lg overflow-hidden',
                    disabled && 'opacity-50 cursor-not-allowed',
                    className,
                )}
                {...props}
            >
                <MDEditor
                    value={value}
                    onChange={onChange}
                    height={height}
                    data-color-mode={resolvedColorMode}
                    preview={preview}
                    visibleDragbar={visibleDragbar}
                    textareaProps={{
                        placeholder,
                        disabled,
                    }}
                />
            </div>
        );
    },
);

MarkdownEditor.displayName = 'MarkdownEditor';

export { MarkdownEditor };
