import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Lang = "zh" | "both" | "en";

export type QStat = { correct: number; wrong: number };

export type MockResult = {
  at: number;
  score: number;
  total: number;
  passed: boolean;
};

type State = {
  lang: Lang;
  stats: Record<string, QStat>;
  wrongIds: string[];
  mocks: MockResult[];
  setLang: (lang: Lang) => void;
  record: (id: string, ok: boolean) => void;
  addMock: (result: MockResult) => void;
  reset: () => void;
};

const empty = {
  lang: "zh" as Lang,
  stats: {} as Record<string, QStat>,
  wrongIds: [] as string[],
  mocks: [] as MockResult[],
};

const storage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

export const useProgress = create<State>()(
  persist(
    (set) => ({
      ...empty,
      setLang: (lang) => set({ lang }),
      record: (id, ok) =>
        set((state) => {
          const prev = state.stats[id] ?? { correct: 0, wrong: 0 };
          const stats = {
            ...state.stats,
            [id]: {
              correct: prev.correct + (ok ? 1 : 0),
              wrong: prev.wrong + (ok ? 0 : 1),
            },
          };
          const wrongIds = ok
            ? state.wrongIds.filter((item) => item !== id)
            : state.wrongIds.includes(id)
              ? state.wrongIds
              : [...state.wrongIds, id];
          return { stats, wrongIds };
        }),
      addMock: (result) => set((state) => ({ mocks: [result, ...state.mocks].slice(0, 12) })),
      reset: () => set((state) => ({ stats: {}, wrongIds: [], mocks: [], lang: state.lang })),
    }),
    {
      name: "lituk-progress-v1",
      storage: createJSONStorage(() => storage),
      skipHydration: true,
    },
  ),
);
