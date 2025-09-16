import { create } from 'zustand';

interface SessionState {
    mentorReady: boolean;
    menteeReady: boolean;
    sessionStarted: boolean;
    mentorName: string;
    menteeName: string;
    setMentorReady: (ready: boolean) => void;
    setMenteeReady: (ready: boolean) => void;
    startSession: () => void;
    resetSession: () => void;
    setMentorName: (name: string) => void;
    setMenteeName: (name: string) => void;
    role: 'mentor' | 'mentee';
}

export const useSessionStore = create<SessionState>((set, get) => ({
    mentorReady: true,
    menteeReady: false,
    sessionStarted: false,
    mentorName: '신우진',
    menteeName: '김민규',
    role: 'mentor',

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

    setMentorName: (name) => set({ mentorName: name }),
    setMenteeName: (name) => set({ menteeName: name }),
}));
