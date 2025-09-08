interface ICameraBox {
    name?: string;
    isLocal: boolean;
    isSpeaking: boolean;
}

export function CameraBox({ name = '이름없음', isLocal, isSpeaking }: ICameraBox) {
    const speakingStyle = isSpeaking && 'border-blue-500';
    return (
        <div
            className={`w-[230px] h-[150px] bg-black rounded-xl relative border-5 border-black ${speakingStyle}`}
        >
            <p className='text-white absolute left-1.5 bottom-1 font-medium text-sm'>
                {isLocal ? 'You' : name}
            </p>
        </div>
    );
}
