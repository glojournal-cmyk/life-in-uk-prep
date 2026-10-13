export type Cue = "correct" | "wrong" | "pass" | "fail" | "on";

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
  gain.gain.exponentialRampToValueAtTime(level, node.currentTime + at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, node.currentTime + at + dur);
  osc.connect(gain);
  gain.connect(node.destination);
  osc.start(node.currentTime + at);
  osc.stop(node.currentTime + at + dur + 0.03);
}

export function playCue(kind: Cue, enabled: boolean) {
  if (!enabled) return;
  if (kind === "correct") {
    tone(523, 0, 0.12, 0.05);
    tone(784, 0.08, 0.18, 0.04);
    return;
  }
  if (kind === "wrong") {
    tone(196, 0, 0.16, 0.04, "triangle");
    tone(155, 0.09, 0.18, 0.03, "triangle");
    return;
  }
  if (kind === "pass") {
    tone(523, 0, 0.12, 0.05);
    tone(659, 0.1, 0.12, 0.045);
    tone(784, 0.2, 0.22, 0.04);
    return;
  }
  if (kind === "fail") {
    tone(349, 0, 0.14, 0.04, "triangle");
    tone(262, 0.12, 0.2, 0.035, "triangle");
    return;
  }
  tone(660, 0, 0.08, 0.03);
}
