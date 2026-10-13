export type ChapterId = 1 | 2 | 3 | 4 | 5;

export type Option = { zh: string; en: string };

export type Question = {
  id: string;
  chapter: ChapterId;
  subtopic: string;
  zh: string;
  en: string;
  options: Option[];
  answer: number[];
  explain: string;
  keys: string[];
};

export const CHAPTERS: {
  id: ChapterId;
  zh: string;
  en: string;
  note: string;
}[] = [
  { id: 1, zh: "價值與原則", en: "Values and principles", note: "責任與基本原則" },
  { id: 2, zh: "英國是甚麼", en: "What is the UK", note: "四國、屬地、海外領土" },
  { id: 3, zh: "悠久的歷史", en: "A long history", note: "最常考，先練這章" },
  { id: 4, zh: "現代社會", en: "Modern society", note: "節日、地標、文化" },
  { id: 5, zh: "政府與法律", en: "Government and law", note: "議會、投票、你的角色" },
];

export function opt(zh: string, en: string): Option {
  return { zh, en };
}
