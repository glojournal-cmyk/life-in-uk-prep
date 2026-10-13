export type Cue = "correct" | "wrong" | "pass" | "fail" | "on" | "select" | "combo" | "level" | "warn" | "star" | "advance" | "start";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, level: number, type: OscillatorType = "sine") {
  const node = audio();
  if (!node) return;
  const osc = node.createOscillator();
  const gain = node.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, node.currentTime + at);
  gain.gain.setValueAtTime(0.0001, node.currentTime + at);
  gain.gain.exponentialRampToValueAtTime(level, node.currentTime + at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, node.currentTime + at + dur);
  osc.connect(gain);
  gain.connect(node.destination);
  osc.start(node.currentTime + at);
  osc.stop(node.currentTime + at + dur + 0.03);
}

export function playCue(kind: Cue, enabled: boolean, streak = 2) {
  if (!enabled) return;
  if (kind === "correct") {
    tone(523, 0, 0.1, 0.05);
    tone(784, 0.08, 0.16, 0.04);
    return;
  }
  if (kind === "wrong") {
    tone(196, 0, 0.14, 0.04, "triangle");
    tone(155, 0.08, 0.16, 0.03, "triangle");
    return;
  }
  if (kind === "pass") {
    tone(523, 0, 0.1, 0.05);
    tone(659, 0.1, 0.1, 0.045);
    tone(784, 0.2, 0.12, 0.04);
    tone(1046, 0.32, 0.22, 0.04);
    return;
  }
  if (kind === "fail") {
    tone(349, 0, 0.12, 0.04, "triangle");
    tone(262, 0.12, 0.18, 0.03, "triangle");
    return;
  }
  if (kind === "select") {
    tone(880, 0, 0.045, 0.025, "square");
    return;
  }
  if (kind === "advance") {
    tone(440, 0, 0.05, 0.02);
    tone(554, 0.04, 0.06, 0.02);
    return;
  }
  if (kind === "start") {
    tone(392, 0, 0.08, 0.035);
    tone(523, 0.09, 0.12, 0.04);
    return;
  }
  if (kind === "combo") {
    const step = Math.min(streak, 8);
    const base = 494 + step * 28;
    tone(base, 0, 0.08, 0.04);
    tone(base * 1.25, 0.07, 0.08, 0.04);
    tone(base * 1.5, 0.14, 0.14, 0.045);
    if (step >= 5) tone(base * 2, 0.24, 0.16, 0.04);
    return;
  }
  if (kind === "level") {
    tone(523, 0, 0.09, 0.045);
    tone(659, 0.09, 0.09, 0.045);
    tone(784, 0.18, 0.09, 0.045);
    tone(1046, 0.28, 0.22, 0.05);
    return;
  }
  if (kind === "star") {
    tone(988, 0, 0.08, 0.04);
    tone(1318, 0.08, 0.16, 0.04);
    return;
  }
  if (kind === "warn") {
    tone(880, 0, 0.07, 0.04, "square");
    tone(880, 0.12, 0.09, 0.035, "square");
    return;
  }
  tone(660, 0, 0.08, 0.03);
}
