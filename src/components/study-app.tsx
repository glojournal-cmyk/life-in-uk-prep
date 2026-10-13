import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  BookOpen,
  ChartColumn,
  Clock3,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  CHAPTERS,
  MOCK_SECONDS,
  PASS_MARK,
  QUESTIONS,
  getQuestion,
  pickMock,
  questionsIn,
  sameSet,
  shuffle,
  type ChapterId,
  type Question,
} from "@/data/questions";
import { useProgress, type Lang } from "@/lib/progress-store";
import { playCue } from "@/lib/sounds";

type View =
  | { name: "home" }
  | { name: "practice"; title: string; ids: string[] }
  | { name: "mock" }
  | { name: "weak" };

export function StudyApp() {
  const [view, setView] = useState<View>({ name: "home" });

  useEffect(() => {
    void useProgress.persist.rehydrate();
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {view.name === "home" ? <Home onOpen={setView} /> : null}
      {view.name === "practice" ? (
        <Practice
          title={view.title}
          ids={view.ids}
          onExit={() => setView({ name: "home" })}
        />
      ) : null}
      {view.name === "mock" ? <MockExam onExit={() => setView({ name: "home" })} /> : null}
      {view.name === "weak" ? (
        <Weakness
          onExit={() => setView({ name: "home" })}
          onPractice={(title, ids) => setView({ name: "practice", title, ids })}
        />
      ) : null}
    </div>
  );
}

function Home({ onOpen }: { onOpen: (view: View) => void }) {
  const lang = useProgress((s) => s.lang);
  const setLang = useProgress((s) => s.setLang);
  const stats = useProgress((s) => s.stats);
  const wrongIds = useProgress((s) => s.wrongIds);
  const reset = useProgress((s) => s.reset);
  const [confirmReset, setConfirmReset] = useState(false);

  const seen = QUESTIONS.filter((q) => {
    const stat = stats[q.id];
    return stat && stat.correct + stat.wrong > 0;
  }).length;
  const attempts = Object.values(stats).reduce((sum, stat) => sum + stat.correct + stat.wrong, 0);
  const correct = Object.values(stats).reduce((sum, stat) => sum + stat.correct, 0);
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-6">
      <header className="flex flex-col gap-3">
        <p className="font-serif text-xs tracking-widest text-stamp">LIFE IN THE UK</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-4xl leading-tight">英國生活備考</h1>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <LangSwitch lang={lang} onChange={setLang} />
          </div>
        </div>
        <p className="max-w-prose text-sm leading-6 text-muted">
          中文記重點，人名地名附英文。題目已內置，斷網仍可練習。進度只留在這部裝置。
        </p>
      </header>

      <section className="rounded-lg border border-line bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted">已做 {seen} / {QUESTIONS.length} 題</p>
          <p className="font-serif text-2xl">{attempts ? `${accuracy}%` : "—"}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-soft">
          <div
            className="h-full bg-stamp"
            style={{ width: `${Math.round((seen / QUESTIONS.length) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">正確率按每次作答計算，不是只計最後一次。</p>
      </section>

      <button
        type="button"
        onClick={() => onOpen({ name: "mock" })}
        className="flex min-h-11 items-center justify-between rounded-lg bg-ink px-4 py-4 text-left text-paper"
      >
        <span>
          <span className="block font-serif text-xl">模擬考試</span>
          <span className="mt-1 block text-sm text-line">24 題 · 45 分鐘 · 18 題合格</span>
        </span>
        <Clock3 aria-hidden="true" className="size-5" />
      </button>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted">按章練習</h2>
        {CHAPTERS.map((chapter) => {
          const list = questionsIn(chapter.id);
          const done = list.filter((q) => {
            const stat = stats[q.id];
            return stat && stat.correct + stat.wrong > 0;
          }).length;
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() =>
                onOpen({
                  name: "practice",
                  title: chapter.zh,
                  ids: shuffle(list).map((q) => q.id),
                })
              }
              className="flex min-h-11 items-center gap-3 rounded-lg border border-line bg-card px-3 py-3 text-left"
            >
              <span className="w-8 font-serif text-2xl text-stamp">{chapter.id}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {chapter.zh}
                  {chapter.id === 3 ? (
                    <span className="ml-2 text-xs font-medium text-stamp">最常考</span>
                  ) : null}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {chapter.note} · {done}/{list.length}
                </span>
              </span>
              <BookOpen aria-hidden="true" className="size-4 text-muted" />
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            onOpen({
              name: "practice",
              title: "錯題本",
              ids: shuffle(wrongIds),
            })
          }
          className="min-h-11 rounded-lg border border-line bg-card px-3 py-3 text-left"
        >
          <span className="block text-sm text-muted">錯題本</span>
          <span className="mt-1 block font-serif text-2xl">{wrongIds.length}</span>
        </button>
        <button
          type="button"
          onClick={() => onOpen({ name: "weak" })}
          className="min-h-11 rounded-lg border border-line bg-card px-3 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm text-muted">
            <ChartColumn aria-hidden="true" className="size-4" />
            弱點分析
          </span>
          <span className="mt-1 block font-serif text-2xl">按章</span>
        </button>
      </section>

      <button
        type="button"
        onClick={() =>
          onOpen({
            name: "practice",
            title: "隨機 20 題",
            ids: shuffle(QUESTIONS).slice(0, 20).map((q) => q.id),
          })
        }
        className="min-h-11 rounded-lg border border-line px-4 py-3 text-left text-sm"
      >
        隨機 20 題，五章都有
      </button>

      <footer className="flex flex-col gap-3 pb-6 text-xs leading-5 text-muted">
        <p>非官方試卷。題目按第三版手冊範圍重寫，正式考試以官方 handbook 為準。</p>
        {confirmReset ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                reset();
                setConfirmReset(false);
              }}
              className="min-h-11 rounded-lg bg-stamp px-3 text-sm text-paper"
            >
              確定清除
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="min-h-11 rounded-lg border border-line px-3 text-sm"
            >
              取消
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmReset(true)} className="min-h-11 self-start text-left">
            清除這部裝置上的進度
          </button>
        )}
      </footer>
    </main>
  );
}

function Practice({
  title,
  ids,
  onExit,
}: {
  title: string;
  ids: string[];
  onExit: () => void;
}) {
  const questions = useMemo(
    () => ids.map((id) => getQuestion(id)).filter((q): q is Question => Boolean(q)),
    [ids],
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState<{ id: string; ok: boolean }[]>([]);
  const record = useProgress((s) => s.record);
  const lang = useProgress((s) => s.lang);
  const soundOn = useProgress((s) => s.soundOn);

  if (questions.length === 0) {
    return (
      <Screen title={title} onExit={onExit}>
        <p className="text-sm leading-6 text-muted">這裏還沒有題目。做完練習、答錯的題會自動進來。</p>
      </Screen>
    );
  }

  if (index >= questions.length) {
    const right = round.filter((item) => item.ok).length;
    return (
      <Screen title={title} onExit={onExit}>
        <p className="font-serif text-4xl">
          {right}/{questions.length}
        </p>
        <p className="text-sm text-muted">這一輪答對的題數。錯題已放進錯題本，再答對會移走。</p>
        <button
          type="button"
          onClick={onExit}
          className="min-h-11 rounded-lg bg-ink px-4 text-sm text-paper"
        >
          返回首頁
        </button>
      </Screen>
    );
  }

  const question = questions[index]!;
  const need = question.answer.length;

  function toggle(optionIndex: number) {
    if (revealed) return;
    setPicked((prev) => {
      if (prev.includes(optionIndex)) return prev.filter((n) => n !== optionIndex);
      if (need === 1) return [optionIndex];
      if (prev.length >= need) return prev;
      return [...prev, optionIndex];
    });
  }

  function submit() {
    if (picked.length !== need) return;
    const ok = sameSet(picked, question.answer);
    record(question.id, ok);
    playCue(ok ? "correct" : "wrong", soundOn);
    setRound((prev) => [...prev, { id: question.id, ok }]);
    setRevealed(true);
  }

  function next() {
    setPicked([]);
    setRevealed(false);
    setIndex((value) => value + 1);
  }

  return (
    <QuizFrame
      title={title}
      progress={`${index + 1} / ${questions.length}`}
      onExit={onExit}
      lang={lang}
    >
      <QuestionCard
        question={question}
        lang={lang}
        picked={picked}
        revealed={revealed}
        onToggle={toggle}
      />
      {revealed ? (
        <Explanation question={question} ok={sameSet(picked, question.answer)} />
      ) : null}
      <div className="sticky bottom-0 bg-paper py-3">
        {revealed ? (
          <button type="button" onClick={next} className="min-h-11 w-full rounded-lg bg-ink text-sm text-paper">
            {index + 1 === questions.length ? "看這一輪成績" : "下一題"}
          </button>
        ) : (
          <button
            type="button"
            disabled={picked.length !== need}
            onClick={submit}
            className="min-h-11 w-full rounded-lg bg-stamp text-sm text-paper disabled:opacity-40"
          >
            {need > 1 ? `核對（已選 ${picked.length}/${need}）` : "核對答案"}
          </button>
        )}
      </div>
    </QuizFrame>
  );
}

function MockExam({ onExit }: { onExit: () => void }) {
  const paper = useMemo(() => pickMock(), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [picked, setPicked] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(MOCK_SECONDS);
  const [done, setDone] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const record = useProgress((s) => s.record);
  const addMock = useProgress((s) => s.addMock);
  const lang = useProgress((s) => s.lang);
  const lock = useRef(false);
  const answersRef = useRef(answers);
  const pickedRef = useRef(picked);
  const indexRef = useRef(index);
  answersRef.current = answers;
  pickedRef.current = picked;
  indexRef.current = index;

  const finish = useCallback(() => {
    if (lock.current) return;
    lock.current = true;
    const current = paper[indexRef.current];
    const finalAnswers = {
      ...answersRef.current,
      ...(current ? { [current.id]: pickedRef.current } : {}),
    };
    let score = 0;
    paper.forEach((item) => {
      const choice = finalAnswers[item.id] ?? [];
      const ok = choice.length > 0 && sameSet(choice, item.answer);
      if (ok) score += 1;
      if (choice.length > 0) record(item.id, ok);
    });
    const passed = score >= PASS_MARK;
    playCue(passed ? "pass" : "fail", useProgress.getState().soundOn);
    addMock({
      at: Date.now(),
      score,
      total: paper.length,
      passed: score >= PASS_MARK,
    });
    setAnswers(finalAnswers);
    setFinalScore(score);
    setDone(true);
  }, [addMock, paper, record]);

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.setTimeout(() => finish(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [done, finish]);

  const question = paper[index];
  if (!question) return null;

  function go(nextIndex: number) {
    const nextAnswers = { ...answers, [question.id]: picked };
    setAnswers(nextAnswers);
    setIndex(nextIndex);
    setPicked(nextAnswers[paper[nextIndex]!.id] ?? []);
  }

  if (done) {
    const passed = finalScore >= PASS_MARK;
    return (
      <Screen title="模擬考試" onExit={onExit}>
        <p className={`font-serif text-sm tracking-widest ${passed ? "text-ok" : "text-stamp"}`}>
          {passed ? "合格" : "未合格"}
        </p>
        <p className="font-serif text-4xl">
          {finalScore}/{paper.length}
        </p>
        <p className="text-sm leading-6 text-muted">
          正式測驗 24 題要對 18 題（75%）。下面可以逐題看中文重點。
        </p>
        <ol className="flex flex-col gap-3">
          {paper.map((item, itemIndex) => {
            const ok = sameSet(answers[item.id] ?? [], item.answer);
            return (
              <li key={item.id} className="rounded-lg border border-line bg-card p-3">
                <p className={`text-xs font-medium ${ok ? "text-ok" : "text-stamp"}`}>
                  {itemIndex + 1}. {ok ? "正確" : "錯誤"}
                </p>
                <p className="mt-1 text-sm leading-6">{lang === "en" ? item.en : item.zh}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{item.explain}</p>
              </li>
            );
          })}
        </ol>
      </Screen>
    );
  }

  const need = question.answer.length;

  return (
    <QuizFrame
      title="模擬考試"
      progress={`${index + 1} / ${paper.length}`}
      onExit={onExit}
      lang={lang}
      extra={<span className={seconds < 60 ? "text-stamp" : "text-muted"}>{clock(seconds)}</span>}
    >
      <p className="text-xs text-muted">模擬卷交卷後才看解釋。可前後翻題，時間到會自動交卷。</p>
      <QuestionCard
        question={question}
        lang={lang}
        picked={picked}
        revealed={false}
        onToggle={(optionIndex) => {
          setPicked((prev) => {
            if (prev.includes(optionIndex)) return prev.filter((n) => n !== optionIndex);
            if (need === 1) return [optionIndex];
            if (prev.length >= need) return prev;
            return [...prev, optionIndex];
          });
        }}
      />
      <div className="sticky bottom-0 flex gap-2 bg-paper py-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => go(index - 1)}
          className="min-h-11 flex-1 rounded-lg border border-line text-sm disabled:opacity-40"
        >
          上一題
        </button>
        {index < paper.length - 1 ? (
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="min-h-11 flex-1 rounded-lg bg-ink text-sm text-paper"
          >
            下一題
          </button>
        ) : (
          <button type="button" onClick={finish} className="min-h-11 flex-1 rounded-lg bg-stamp text-sm text-paper">
            交卷
          </button>
        )}
      </div>
    </QuizFrame>
  );
}

function Weakness({
  onExit,
  onPractice,
}: {
  onExit: () => void;
  onPractice: (title: string, ids: string[]) => void;
}) {
  const stats = useProgress((s) => s.stats);
  const mocks = useProgress((s) => s.mocks);

  const rows = CHAPTERS.map((chapter) => {
    const list = questionsIn(chapter.id);
    let correct = 0;
    let wrong = 0;
    list.forEach((q) => {
      const stat = stats[q.id];
      if (!stat) return;
      correct += stat.correct;
      wrong += stat.wrong;
    });
    const attempts = correct + wrong;
    return {
      name: chapter.zh,
      short: ["價值", "英國", "歷史", "社會", "政府"][chapter.id - 1],
      id: chapter.id,
      accuracy: attempts ? Math.round((correct / attempts) * 100) : null,
      attempts,
    };
  });

  const weakTopics = topicRows(stats).filter((row) => row.attempts >= 2 && row.accuracy < 80);

  return (
    <Screen title="弱點分析" onExit={onExit}>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="short" tick={{ fill: "var(--color-muted)", fontSize: 12 }} interval={0} />
            <YAxis domain={[0, 100]} tick={{ fill: "var(--color-muted)", fontSize: 11 }} />
            <Tooltip
              formatter={(value) => [`${value}%`, "正確率"]}
              cursor={{ fill: "var(--color-ink-soft)" }}
            />
            <Bar dataKey="accuracy" fill="var(--color-stamp)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between text-sm">
            <span>{row.name}</span>
            <span className="text-muted">{row.attempts ? `${row.accuracy}% · ${row.attempts} 次` : "未做"}</span>
          </li>
        ))}
      </ul>
      <h2 className="font-serif text-xl">需要再練</h2>
      {weakTopics.length === 0 ? (
        <p className="text-sm leading-6 text-muted">做夠題之後，正確率低過 80% 的細題會出現在這裏。</p>
      ) : (
        weakTopics.map((topic) => (
          <button
            key={topic.name}
            type="button"
            onClick={() => onPractice(topic.name, shuffle(topic.ids))}
            className="min-h-11 rounded-lg border border-line bg-card px-3 py-3 text-left"
          >
            <span className="block font-medium">{topic.name}</span>
            <span className="text-xs text-muted">{topic.accuracy}% · {topic.ids.length} 題</span>
          </button>
        ))
      )}
      <h2 className="font-serif text-xl">最近模擬</h2>
      {mocks.length === 0 ? (
        <p className="text-sm text-muted">還沒有模擬成績。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {mocks.map((mock) => (
            <li key={mock.at} className="flex items-center justify-between rounded-lg border border-line bg-card px-3 py-3 text-sm">
              <span>{new Date(mock.at).toLocaleDateString("zh-HK")}</span>
              <span className={mock.passed ? "text-ok" : "text-stamp"}>
                {mock.score}/{mock.total} · {mock.passed ? "合格" : "未合格"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

function QuestionCard({
  question,
  lang,
  picked,
  revealed,
  onToggle,
}: {
  question: Question;
  lang: Lang;
  picked: number[];
  revealed: boolean;
  onToggle: (index: number) => void;
}) {
  const need = question.answer.length;
  return (
    <article className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        {CHAPTERS.find((chapter) => chapter.id === question.chapter)?.zh} · {question.subtopic}
        {need > 1 ? ` · 選 ${need} 項` : ""}
      </p>
      <h2 className="font-serif text-xl leading-8">
        {lang === "en" ? question.en : question.zh}
      </h2>
      {lang === "both" ? <p className="text-sm leading-6 text-muted">{question.en}</p> : null}
      <ul className="flex flex-col gap-2">
        {question.options.map((option, optionIndex) => {
          const selected = picked.includes(optionIndex);
          const correct = question.answer.includes(optionIndex);
          let tone = "border-line bg-card";
          if (revealed && correct) tone = "border-ok bg-ok-soft";
          else if (revealed && selected) tone = "border-stamp bg-stamp-soft";
          else if (selected) tone = "border-ink bg-ink-soft";
          return (
            <li key={option.en}>
              <button
                type="button"
                onClick={() => onToggle(optionIndex)}
                className={`min-h-11 w-full rounded-lg border px-3 py-3 text-left text-sm leading-6 ${tone}`}
              >
                <span className="block">{lang === "en" ? option.en : option.zh}</span>
                {lang !== "en" && option.en !== option.zh ? (
                  <span className="mt-1 block text-xs text-muted">{option.en}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function Explanation({ question, ok }: { question: Question; ok: boolean }) {
  return (
    <section className={`rounded-lg px-3 py-3 ${ok ? "bg-ok-soft" : "bg-stamp-soft"}`}>
      <p className={`text-sm font-medium ${ok ? "text-ok" : "text-stamp"}`}>{ok ? "正確" : "再記一次"}</p>
      <p className="mt-1 text-sm leading-6">{question.explain}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {question.keys.map((key) => (
          <li key={key} className="rounded-full bg-card px-2 py-1 text-xs">
            {key}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Screen({
  title,
  onExit,
  children,
}: {
  title: string;
  onExit: () => void;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-5 py-5">
      <TopBar title={title} onExit={onExit} />
      {children}
    </main>
  );
}

function QuizFrame({
  title,
  progress,
  onExit,
  lang,
  extra,
  children,
}: {
  title: string;
  progress: string;
  onExit: () => void;
  lang: Lang;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const setLang = useProgress((s) => s.setLang);
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <TopBar title={title} onExit={onExit} inline />
        <div className="flex items-center gap-3 text-sm">
          {extra}
          <span className="text-muted">{progress}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <LangSwitch lang={lang} onChange={setLang} />
        <SoundToggle />
      </div>
      {children}
    </main>
  );
}

function TopBar({
  title,
  onExit,
  inline = false,
}: {
  title: string;
  onExit: () => void;
  inline?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${inline ? "" : ""}`}>
      <button
        type="button"
        onClick={onExit}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-line bg-card"
        aria-label="返回"
      >
        <ArrowLeft className="size-4" />
      </button>
      <h1 className="font-serif text-xl">{title}</h1>
    </div>
  );
}

function SoundToggle() {
  const soundOn = useProgress((s) => s.soundOn);
  const setSound = useProgress((s) => s.setSound);
  return (
    <button
      type="button"
      aria-label={soundOn ? "關閉音效" : "開啟音效"}
      aria-pressed={soundOn}
      onClick={() => {
        const next = !soundOn;
        setSound(next);
        playCue("on", next);
      }}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line bg-card"
    >
      {soundOn ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4 text-muted" aria-hidden="true" />}
    </button>
  );
}

function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  const options: { id: Lang; label: string }[] = [
    { id: "zh", label: "中文" },
    { id: "both", label: "中英" },
    { id: "en", label: "EN" },
  ];
  return (
    <div className="flex rounded-full border border-line bg-card p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`min-h-11 rounded-full px-3 text-xs ${
            lang === option.id ? "bg-ink text-paper" : "text-muted"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function topicRows(stats: Record<string, { correct: number; wrong: number }>) {
  const map = new Map<string, { accuracy: number; attempts: number; ids: string[] }>();
  const bucket = new Map<string, { correct: number; wrong: number; ids: string[] }>();
  QUESTIONS.forEach((question) => {
    const stat = stats[question.id];
    if (!stat || stat.correct + stat.wrong === 0) return;
    const current = bucket.get(question.subtopic) ?? { correct: 0, wrong: 0, ids: [] };
    current.correct += stat.correct;
    current.wrong += stat.wrong;
    current.ids.push(question.id);
    bucket.set(question.subtopic, current);
  });
  bucket.forEach((value, name) => {
    const attempts = value.correct + value.wrong;
    map.set(name, {
      accuracy: Math.round((value.correct / attempts) * 100),
      attempts,
      ids: value.ids,
    });
  });
  return [...map.entries()].map(([name, value]) => ({ name, ...value }));
}

function clock(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
