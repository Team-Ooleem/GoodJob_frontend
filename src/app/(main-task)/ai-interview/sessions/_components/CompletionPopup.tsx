'use client';

interface CompletionPopupProps {
    isVisible: boolean;
    onClose: () => void;
}

export default function CompletionPopup({ isVisible, onClose }: CompletionPopupProps) {
    if (!isVisible) return null;

    return (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-[5000]'>
            <div className='bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform transition-all duration-300 scale-100'>
                <div className='text-center'>
                    {/* 완료 아이콘 */}
                    <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <svg
                            className='w-8 h-8 text-green-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M5 13l4 4L19 7'
                            />
                        </svg>
                    </div>

                    {/* 완료 메시지 */}
                    <h2 className='text-2xl font-bold text-gray-900 mb-2'>
                        모든 답변이 완료되었습니다!
                    </h2>
                    <p className='text-gray-600 mb-6'>
                        면접 결과를 분석하고 있습니다.
                        <br />
                        잠시만 기다려주세요...
                    </p>

                    {/* 로딩 스피너 */}
                    <div className='w-8 h-8 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto'></div>
                </div>
            </div>
        </div>
    );
}
