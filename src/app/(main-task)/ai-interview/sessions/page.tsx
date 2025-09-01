// local components
import { Webcam, Question } from '../_components';

export default function AiInterviewSessionsPage() {
    return (
        <div className='w-screen h-screen bg-blue-50'>
            <Webcam css='absolute top-[40px] right-[40px]' />
            <Question />
        </div>
    );
}
