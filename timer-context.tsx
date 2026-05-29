import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";

export type Phase = "focus" | "break";
export type TimerMode = "countdown" | "stopwatch";

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatTimeHMS(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function playSound(type: "start" | "stop" | "break" | "complete") {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const play = (freq: number, startAt: number, duration: number, vol = 0.35) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
      g.gain.setValueAtTime(vol, ctx.currentTime + startAt);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + startAt + duration);
    };

    if (type === "start") {
      play(440, 0, 0.15);
      play(660, 0.18, 0.2);
    } else if (type === "stop") {
      play(440, 0, 0.12);
      play(330, 0.14, 0.18);
    } else if (type === "break") {
      play(528, 0, 0.25, 0.3);
      play(660, 0.28, 0.25, 0.25);
      play(792, 0.56, 0.4, 0.2);
    } else {
      play(440, 0, 0.6);
      play(550, 0.05, 0.6, 0.25);
      play(660, 0.1, 0.8, 0.2);
    }

    gain.disconnect();
  } catch {}
}

interface TimerContextValue {
  // mode
  timerMode: TimerMode;
  setTimerMode: (m: TimerMode) => void;
  // countdown
  totalSeconds: number;
  remaining: number;
  running: boolean;
  phase: Phase;
  done: boolean;
  customMinutes: string;
  setCustomMinutes: (v: string) => void;
  applyPreset: (minutes: number, phase: Phase) => void;
  applyCustom: () => void;
  applySeconds: (totalSecs: number) => void;
  reset: () => void;
  toggleRun: () => void;
  // stopwatch
  elapsed: number;
  stopwatchRunning: boolean;
  toggleStopwatch: () => void;
  resetStopwatch: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [timerMode, setTimerMode] = useState<TimerMode>("countdown");

  // --- Countdown state ---
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("focus");
  const [customMinutes, setCustomMinutes] = useState("");
  const [done, setDone] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        stopCountdown();
        setRunning(false);
        setDone(true);
        playSound("complete");
        return 0;
      }
      return prev - 1;
    });
  }, [stopCountdown]);

  useEffect(() => {
    if (running) {
      countdownRef.current = setInterval(tick, 1000);
    } else {
      stopCountdown();
    }
    return stopCountdown;
  }, [running, tick, stopCountdown]);

  function applyPreset(minutes: number, p: Phase) {
    stopCountdown();
    setRunning(false);
    setDone(false);
    setPhase(p);
    setTotalSeconds(minutes * 60);
    setRemaining(minutes * 60);
    setCustomMinutes("");
    if (p === "break") playSound("break");
  }

  function applyCustom() {
    const mins = parseInt(customMinutes, 10);
    if (!mins || mins < 1 || mins > 180) return;
    stopCountdown();
    setRunning(false);
    setDone(false);
    setPhase("focus");
    setTotalSeconds(mins * 60);
    setRemaining(mins * 60);
  }

  function applySeconds(totalSecs: number) {
    if (totalSecs < 1) return;
    stopCountdown();
    setRunning(false);
    setDone(false);
    setPhase("focus");
    setTotalSeconds(totalSecs);
    setRemaining(totalSecs);
  }

  function reset() {
    stopCountdown();
    setRunning(false);
    setDone(false);
    setRemaining(totalSeconds);
  }

  function toggleRun() {
    if (done) return;
    setRunning((r) => {
      playSound(r ? "stop" : "start");
      return !r;
    });
  }

  // --- Stopwatch state ---
  const [elapsed, setElapsed] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStopwatch = useCallback(() => {
    if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
      stopwatchRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (stopwatchRunning) {
      stopwatchRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      stopStopwatch();
    }
    return stopStopwatch;
  }, [stopwatchRunning, stopStopwatch]);

  function toggleStopwatch() {
    setStopwatchRunning((r) => {
      playSound(r ? "stop" : "start");
      return !r;
    });
  }

  function resetStopwatch() {
    stopStopwatch();
    setStopwatchRunning(false);
    setElapsed(0);
  }

  return (
    <TimerContext.Provider
      value={{
        timerMode, setTimerMode,
        totalSeconds, remaining, running, phase, done,
        customMinutes, setCustomMinutes,
        applyPreset, applyCustom, applySeconds, reset, toggleRun,
        elapsed, stopwatchRunning, toggleStopwatch, resetStopwatch,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used inside TimerProvider");
  return ctx;
}
