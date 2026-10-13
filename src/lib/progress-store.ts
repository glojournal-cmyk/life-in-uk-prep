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
  soundOn: boolean;
  stats: Record<string, QStat>;
  wrongIds: string[];
  mocks: MockResult[];
  xp: number;
  bestStreak: number;
  setLang: (lang: Lang) => void;
  setSound: (soundOn: boolean) => void;
  record: (id: string, ok: boolean) => void;
  addScore: (points: number, streak: number) => void;
  addMock: (result: MockResult) => void;
  reset: () => void;
};

const empty = {
  lang: "zh" as Lang,
  soundOn: true,
  stats: {} as Record<string, QStat>,
  wrongIds: [] as string[],
  mocks: [] as MockResult[],
  xp: 0,
  bestStreak: 0,
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

export const RANKS = [
  { xp: 0, name: "見習考生" },
  { xp: 80, name: "初級考生" },
  { xp: 200, name: "熟練考生" },
  { xp: 400, name: "挑戰者" },
  { xp: 700, name: "準合格" },
  { xp: 1100, name: "英國通" },
  { xp: 1600, name: "滿分候選" },
];

export function rankOf(xp: number) {
  let index = 0;
  for (let i = 0; i < RANKS.length; i += 1) {
    if (xp >= RANKS[i].xp) index = i;
  }
  return { current: RANKS[index], next: RANKS[index + 1] };
}

export function pointsFor(streak: number) {
  return 10 + Math.min(streak, 8) * 2;
}

export const useProgress = create<State>()(
  persist(
    (set) => ({
      ...empty,
      setLang: (lang) => set({ lang }),
      setSound: (soundOn) => set({ soundOn }),
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
      addScore: (points, streak) =>
        set((state) => ({
          xp: (state.xp ?? 0) + points,
          bestStreak: Math.max(state.bestStreak ?? 0, streak),
        })),
      addMock: (result) => set((state) => ({ mocks: [result, ...state.mocks].slice(0, 12) })),
      reset: () =>
        set((state) => ({
          stats: {},
          wrongIds: [],
          mocks: [],
          xp: 0,
          bestStreak: 0,
          lang: state.lang,
          soundOn: state.soundOn,
        })),
    }),
    {
      name: "lituk-progress-v1",
      storage: createJSONStorage(() => storage),
      skipHydration: true,
    },
  ),
);
