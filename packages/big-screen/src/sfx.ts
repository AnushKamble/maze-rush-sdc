// ============================================================
// Maze Rush — synthesized sound effects (WebAudio, no assets).
// Kept intentionally simple: short oscillator blips/sweeps that
// read as "retro arcade" without needing any audio files.
// ============================================================

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Call this from a real user-gesture handler (e.g. the first button tap) to unlock audio on mobile Safari/Chrome. */
export function unlockAudio() {
  getCtx();
}

interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
  delay?: number;
  gain?: number;
  slideTo?: number;
}

function playTones(tones: Tone[]) {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;
  for (const t of tones) {
    const osc = audio.createOscillator();
    const gainNode = audio.createGain();
    osc.type = t.type ?? "square";
    const start = now + (t.delay ?? 0);
    const end = start + t.duration;
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(t.slideTo, 1), end);
    const peak = t.gain ?? 0.12;
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, t.duration / 4));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gainNode);
    gainNode.connect(audio.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

export const sfx = {
  click() {
    playTones([{ freq: 660, duration: 0.05, type: "square", gain: 0.08 }]);
  },
  eat() {
    playTones([{ freq: 880, duration: 0.06, type: "square", slideTo: 1200, gain: 0.09 }]);
  },
  powerUp() {
    playTones([
      { freq: 440, duration: 0.09, type: "square", delay: 0, gain: 0.1 },
      { freq: 660, duration: 0.09, type: "square", delay: 0.08, gain: 0.1 },
      { freq: 880, duration: 0.14, type: "square", delay: 0.16, gain: 0.11 },
    ]);
  },
  hit() {
    playTones([
      { freq: 300, duration: 0.16, type: "sawtooth", slideTo: 90, gain: 0.13 },
      { freq: 220, duration: 0.2, type: "sawtooth", slideTo: 60, delay: 0.12, gain: 0.11 },
    ]);
  },
  levelUp() {
    playTones([
      { freq: 523, duration: 0.1, type: "square", delay: 0, gain: 0.1 },
      { freq: 659, duration: 0.1, type: "square", delay: 0.1, gain: 0.1 },
      { freq: 784, duration: 0.1, type: "square", delay: 0.2, gain: 0.1 },
      { freq: 1046, duration: 0.22, type: "square", delay: 0.3, gain: 0.12 },
    ]);
  },
  gameOver() {
    playTones([
      { freq: 392, duration: 0.18, type: "sawtooth", delay: 0, gain: 0.11 },
      { freq: 330, duration: 0.18, type: "sawtooth", delay: 0.18, gain: 0.11 },
      { freq: 262, duration: 0.34, type: "sawtooth", delay: 0.36, slideTo: 140, gain: 0.12 },
    ]);
  },
  victory() {
    playTones([
      { freq: 523, duration: 0.12, type: "square", delay: 0, gain: 0.1 },
      { freq: 659, duration: 0.12, type: "square", delay: 0.12, gain: 0.1 },
      { freq: 784, duration: 0.12, type: "square", delay: 0.24, gain: 0.1 },
      { freq: 1046, duration: 0.12, type: "square", delay: 0.36, gain: 0.11 },
      { freq: 1318, duration: 0.4, type: "square", delay: 0.48, gain: 0.13 },
    ]);
  },
};
