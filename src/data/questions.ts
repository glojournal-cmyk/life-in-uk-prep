import { HISTORY } from "./bank-history";
import { REST } from "./bank-rest";
import { CHAPTERS, type ChapterId, type Question } from "./types";

export { CHAPTERS };
export type { ChapterId, Question };

export const QUESTIONS: Question[] = [...REST, ...HISTORY];

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return byId.get(id);
}

export function questionsIn(chapter: ChapterId): Question[] {
  return QUESTIONS.filter((q) => q.chapter === chapter);
}

export function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((n) => set.has(n));
}

export function shuffle<T>(list: readonly T[]): T[] {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j]!;
    next[j] = tmp!;
  }
  return next;
}

const MOCK_QUOTA: Record<ChapterId, number> = { 1: 2, 2: 2, 3: 10, 4: 5, 5: 5 };

export function pickMock(pool: Question[] = QUESTIONS): Question[] {
  const used = new Set<string>();
  const picked: Question[] = [];
  const chapters: ChapterId[] = [1, 2, 3, 4, 5];
  chapters.forEach((chapter) => {
    const quota = MOCK_QUOTA[chapter];
    const slice = shuffle(pool.filter((q) => q.chapter === chapter)).slice(0, quota);
    slice.forEach((q) => {
      picked.push(q);
      used.add(q.id);
    });
  });
  if (picked.length < 24) {
    shuffle(pool).forEach((q) => {
      if (picked.length >= 24 || used.has(q.id)) return;
      picked.push(q);
      used.add(q.id);
    });
  }
  return shuffle(picked).slice(0, 24);
}

export const PASS_MARK = 18;
export const MOCK_SECONDS = 45 * 60;
export const MOCK_SIZE = 24;
