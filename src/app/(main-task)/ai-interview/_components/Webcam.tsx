interface IWebcam {
    css?: string;
}

export function Webcam({ css }: IWebcam) {
    return <div className={`w-[384px] h-[216px] rounded-2xl bg-gray-300 ${css}`}></div>;
}
