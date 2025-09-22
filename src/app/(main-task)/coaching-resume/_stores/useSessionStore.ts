import { create } from 'zustand';

interface SessionState {
    mentorReady: boolean;
    menteeReady: boolean;
    sessionStarted: boolean;
    sessionCompleted: boolean;
    mentorName: string;
    menteeName: string;
    role: 'mentor' | 'mentee';
    setMentorReady: (ready: boolean) => void;
    setMenteeReady: (ready: boolean) => void;
    startSession: () => void;
    setSessionCompleted: (completed: boolean) => void;
    resetSession: () => void;
    setMentorName: (name: string) => void;
    setMenteeName: (name: string) => void;
    setRole: (role: 'mentor' | 'mentee') => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
    mentorReady: true,
    menteeReady: false,
    sessionStarted: false,
    sessionCompleted: false,
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

    setSessionCompleted: (completed) => set({ sessionCompleted: completed }),

    startSession: () => set({ sessionStarted: true }),

    resetSession: () =>
        set({
            mentorReady: false,
            menteeReady: false,
            sessionStarted: false,
            sessionCompleted: false,
        }),

    setMentorName: (name) => set({ mentorName: name }),
    setMenteeName: (name) => set({ menteeName: name }),
    setRole: (role) => set({ role }),
}));
