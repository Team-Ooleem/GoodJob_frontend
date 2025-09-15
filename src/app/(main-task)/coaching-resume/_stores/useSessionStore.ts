import { create } from 'zustand';

interface SessionState {
    mentorReady: boolean;
    menteeReady: boolean;
    sessionStarted: boolean;
    setMentorReady: (ready: boolean) => void;
    setMenteeReady: (ready: boolean) => void;
    startSession: () => void;
    resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
    mentorReady: false,
    menteeReady: false,
    sessionStarted: false,

    setMentorReady: (ready) => {
        set({ mentorReady: ready });
        const { menteeReady } = get();
        if (ready && menteeReady) {
            get().startSession();
        }
    },

    setMenteeReady: (ready) => {
        set({ menteeReady: ready });
        const { mentorReady } = get();
        if (ready && mentorReady) {
            get().startSession();
        }
    },

    startSession: () => set({ sessionStarted: true }),

    resetSession: () =>
        set({
            mentorReady: false,
            menteeReady: false,
            sessionStarted: false,
        }),
}));
