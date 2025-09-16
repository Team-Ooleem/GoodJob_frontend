import { useState } from 'react';

export type QuestionDto = { id: string; text: string };

/**
 * 면접 질문 관리를 위한 커스텀 훅
 * 질문 목록, 현재 질문 인덱스, 질문 추가/이동 등의 기능을 제공
 */
export const useQuestionManager = () => {
    const [questions, setQuestions] = useState<QuestionDto[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const currentQuestion = questions[currentIndex] || null;
    const hasCurrentQuestion = !!currentQuestion;
    const questionText = currentQuestion?.text || '';
    const questionId = currentQuestion?.id || `q${currentIndex + 1}`;
    // 서버 저장/집계용 고정 문항 ID(1,2,3...)
    const persistId = String(currentIndex + 1);

    const addQuestion = (question: QuestionDto) => {
        setQuestions((prev) => [...prev, question]);
    };

    const moveToNext = () => {
        setCurrentIndex((prev) => prev + 1);
    };

    const isLastQuestion = (maxQuestions: number) => {
        return currentIndex >= maxQuestions - 1;
    };

    return {
        questions,
        currentIndex,
        currentQuestion,
        hasCurrentQuestion,
        questionText,
        questionId,
        persistId,
        isLoading,
        setIsLoading,
        addQuestion,
        moveToNext,
        isLastQuestion,
    };
};
