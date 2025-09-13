'use client';

import { useCallback } from 'react';
import { useRecordingStore } from '../_stores/useRecordingStore';
import {
    transformBackendToFrontend,
    STTWithContextResponse,
    SessionUserResponse,
    ChatSession,
    BackendSessionMessage, // 🆕 추가
} from '@/apis/Recording-api';
import { API_BASE_URL } from '@/constants/config';

export const useSessionData = (canvasIdx: string) => {
    const {
        sessions,
        loading,
        error,
        page,
        setSessions,
        setLoading,
        setError,
        addSessions,
        incrementPage,
    } = useRecordingStore();

    const fetchSessionMessages = useCallback(
        async (pageNum: number = 1) => {
            setError(null);
            setLoading(true);

            try {
                // 1. 세션 사용자 정보 조회
                const userResponse = await fetch(`${API_BASE_URL}/stt/session-users/${canvasIdx}`);
                const userData: SessionUserResponse = await userResponse.json();

                // userData가 유효한지 확인
                if (!userData || !userData.mentor || !userData.mentee) {
                    setError('Invalid user data received');
                    return [];
                }

                // 2. 세션 메시지 조회
                const response = await fetch(
                    `${API_BASE_URL}/stt/session-messages/${canvasIdx}?page=${pageNum}`,
                );
                const data: STTWithContextResponse = await response.json();

                if (data.success) {
                    // 3. 백엔드 응답을 프론트엔드 구조로 변환
                    // messages가 undefined이거나 배열이 아닌 경우를 대비한 안전한 처리
                    const messagesArray = Array.isArray(data.messages) ? data.messages : [];
                    const transformedSessions: ChatSession[] = messagesArray.map(
                        (
                            session: BackendSessionMessage, // 🆕 any → BackendSessionMessage
                        ) =>
                            transformBackendToFrontend(
                                session,
                                userData.mentor.idx,
                                userData.mentee.idx,
                            ),
                    );

                    return transformedSessions;
                } else {
                    setError(data.message || 'Failed to fetch sessions');
                    return [];
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setError(errorMessage);
                console.error('세션 데이터 조회 실패:', error);
                return [];
            } finally {
                setLoading(false);
            }
        },
        [canvasIdx, setError, setLoading],
    );

    const loadMore = useCallback(async () => {
        if (loading) return;

        try {
            const newSessions = await fetchSessionMessages(page + 1);
            if (newSessions.length > 0) {
                addSessions(newSessions);
                incrementPage();
            }
        } catch (error) {
            console.error('Failed to load more sessions:', error);
        }
    }, [loading, page, fetchSessionMessages, addSessions, incrementPage]);

    return {
        sessions,
        loading,
        error,
        fetchSessionMessages,
        loadMore,
        setSessions,
    };
};
