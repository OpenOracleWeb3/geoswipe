import { useEffect, useRef } from "react";

type FeedbackKind = "correct" | "incorrect" | "timeout";

const SHARED_FEEDBACK_SOUND_URL = "/sounds/answer-feedback.wav";

function triggerHaptic(pattern: number | number[]) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function getHapticPattern(kind: FeedbackKind): number | number[] {
  if (kind === "correct") {
    return [14, 24, 18];
  }

  if (kind === "timeout") {
    return [18, 28, 18, 28, 18];
  }

  return [42, 26, 52];
}

function createOscillator(
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = "sine",
  endFrequency?: number
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  if (typeof endFrequency === "number") {
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration);
  }
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

function playSynthFeedback(context: AudioContext, kind: FeedbackKind) {
  const now = context.currentTime;

  if (kind === "correct") {
    // Coin hit transient.
    createOscillator(context, 980, now, 0.03, 0.03, "square", 1480);
    // Main "cha".
    createOscillator(context, 720, now + 0.018, 0.11, 0.07, "triangle", 1120);
    createOscillator(context, 1440, now + 0.018, 0.07, 0.028, "sine");
    // Bright "ching".
    createOscillator(context, 1040, now + 0.11, 0.16, 0.08, "triangle", 1560);
    createOscillator(context, 2080, now + 0.11, 0.12, 0.026, "sine");
    return;
  }

  if (kind === "timeout") {
    createOscillator(context, 280, now, 0.12, 0.07);
    createOscillator(context, 220, now + 0.14, 0.16, 0.06);
    return;
  }

  createOscillator(context, 210, now, 0.12, 0.08);
  createOscillator(context, 160, now + 0.1, 0.16, 0.07);
}

async function safelyPlayAudio(audio: HTMLAudioElement, kind: FeedbackKind) {
  const clip = audio.cloneNode(true) as HTMLAudioElement;
  clip.currentTime = 0;
  clip.volume = kind === "correct" ? 0.72 : kind === "timeout" ? 0.56 : 0.64;
  clip.playbackRate = kind === "correct" ? 1.06 : kind === "timeout" ? 0.78 : 0.9;
  await clip.play();
}

export function useRoundFeedback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const customAudioStatusRef = useRef<"idle" | "loading" | "ready" | "missing">("idle");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const audio = new Audio(SHARED_FEEDBACK_SOUND_URL);
    audio.preload = "auto";

    const markReady = () => {
      customAudioStatusRef.current = "ready";
      customAudioRef.current = audio;
    };

    const markMissing = () => {
      customAudioStatusRef.current = "missing";
      customAudioRef.current = null;
    };

    customAudioStatusRef.current = "loading";
    audio.addEventListener("canplaythrough", markReady, { once: true });
    audio.addEventListener("error", markMissing, { once: true });
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener("canplaythrough", markReady);
      audio.removeEventListener("error", markMissing);
    };
  }, []);

  const playRoundFeedback = async ({ correct, timedOut }: { correct: boolean; timedOut: boolean }) => {
    const kind: FeedbackKind = timedOut ? "timeout" : correct ? "correct" : "incorrect";
    triggerHaptic(getHapticPattern(kind));

    if (typeof window === "undefined") {
      return;
    }

    if (customAudioStatusRef.current === "ready" && customAudioRef.current) {
      try {
        await safelyPlayAudio(customAudioRef.current, kind);
        return;
      } catch {
        customAudioStatusRef.current = "missing";
      }
    }

    const AudioContextCtor =
      window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }
      playSynthFeedback(audioContextRef.current, kind);
    } catch {
      // Ignore feedback failures; gameplay should continue.
    }
  };

  return {
    playRoundFeedback
  };
}
