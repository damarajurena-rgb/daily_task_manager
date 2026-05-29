import { useState } from "react";
import { Layout } from "@/components/layout";
import { Timer, RotateCcw, Play, Pause } from "lucide-react";
import { useTimer, formatTime, formatTimeHMS } from "@/context/timer-context";

const PRESETS: { label: string; minutes: number; phase: "focus" | "break" }[] = [
  { label: "Focus", minutes: 25, phase: "focus" },
  { label: "Short break", minutes: 5, phase: "break" },
  { label: "Long break", minutes: 15, phase: "break" },
];

export function TimerPage() {
  const {
    timerMode, setTimerMode,
    totalSeconds, remaining, running, phase, done,
    applyPreset, applySeconds, reset, toggleRun,
    elapsed, stopwatchRunning, toggleStopwatch, resetStopwatch,
  } = useTimer();

  const [hInput, setHInput] = useState("0");
  const [mInput, setMInput] = useState("25");
  const [sInput, setSInput] = useState("0");

  function applyHMS() {
    const h = Math.max(0, parseInt(hInput) || 0);
    const m = Math.max(0, parseInt(mInput) || 0);
    const s = Math.max(0, parseInt(sInput) || 0);
    applySeconds(h * 3600 + m * 60 + s);
  }

  // --- Countdown ring ---
  const progress = totalSeconds > 0 ? 1 - remaining / totalSeconds : 1;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const ringColor = phase === "focus" ? "hsl(var(--primary))" : "hsl(160 40% 50%)";
  const ringBg = phase === "focus" ? "hsl(var(--primary) / 0.12)" : "hsl(160 40% 50% / 0.12)";

  return (
    <Layout>
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Timer className="w-6 h-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-serif text-foreground">Study Timer</h1>
        </div>
        <p className="text-muted-foreground">Stay focused, then rest.</p>
      </header>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-10 mx-auto">
        {(["countdown", "stopwatch"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setTimerMode(mode)}
            className={`px-6 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
              timerMode === mode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode === "countdown" ? "Countdown" : "Stopwatch"}
          </button>
        ))}
      </div>

      {timerMode === "countdown" ? (
        <div className="flex flex-col items-center gap-10">
          {/* Preset buttons */}
          <div className="flex gap-3 flex-wrap justify-center">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.minutes, p.phase)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  totalSeconds === p.minutes * 60 && phase === p.phase
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {p.label} · {p.minutes}m
              </button>
            ))}
          </div>

          {/* Ring */}
          <div className="relative flex items-center justify-center">
            <svg width="300" height="300" className="-rotate-90">
              <circle cx="150" cy="150" r={radius} fill="none" stroke={ringBg} strokeWidth="12" />
              <circle
                cx="150" cy="150" r={radius}
                fill="none" stroke={ringColor} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                style={{ transition: running ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.3s ease" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center gap-1">
              <span className={`font-mono text-6xl font-light tracking-tight tabular-nums transition-colors duration-300 ${done ? "text-primary" : "text-foreground"}`}>
                {formatTime(remaining)}
              </span>
              <span className="text-sm text-muted-foreground uppercase tracking-widest">
                {done ? "Complete" : phase === "focus" ? "Focus" : "Break"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button onClick={reset} className="w-12 h-12 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-200 flex items-center justify-center" title="Reset">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button onClick={toggleRun} disabled={done}
              className={`w-20 h-20 rounded-full text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${running ? "bg-primary/80 hover:bg-primary/70" : "bg-primary hover:bg-primary/90"}`}
            >
              {running ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
            </button>
            <div className="w-12 h-12" />
          </div>

          {/* Custom HH:MM:SS duration */}
          <div className="flex items-center gap-2 mt-2">
            {[
              { label: "h", value: hInput, set: setHInput, max: 23 },
              { label: "m", value: mInput, set: setMInput, max: 59 },
              { label: "s", value: sInput, set: setSInput, max: 59 },
            ].map(({ label, value, set, max }, i) => (
              <div key={label} className="flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground font-mono text-lg">:</span>}
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyHMS()}
                    className="w-16 px-2 py-2 rounded-xl bg-muted border border-border text-sm text-foreground text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-xs text-muted-foreground mt-1">{label}</span>
                </div>
              </div>
            ))}
            <button
              onClick={applyHMS}
              className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:bg-muted/80 hover:text-foreground transition-all duration-200 self-start mt-0.5"
            >
              Set
            </button>
          </div>

          {done && (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
              <p className="text-lg font-serif text-foreground mb-1">Time's up.</p>
              <p className="text-muted-foreground text-sm">Press reset to start another session.</p>
            </div>
          )}
        </div>
      ) : (
        /* Stopwatch */
        <div className="flex flex-col items-center gap-10">
          {/* Big display */}
          <div className="relative flex items-center justify-center">
            <svg width="300" height="300" className="-rotate-90">
              <circle cx="150" cy="150" r={radius} fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="12" />
              {stopwatchRunning || elapsed > 0 ? (
                <circle
                  cx="150" cy="150" r={radius}
                  fill="none" stroke="hsl(var(--primary))" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - ((elapsed % 3600) / 3600))}
                  style={{ transition: stopwatchRunning ? "stroke-dashoffset 1s linear" : "none" }}
                />
              ) : null}
            </svg>
            <div className="absolute flex flex-col items-center gap-1">
              <span className="font-mono text-5xl font-light tracking-tight tabular-nums text-foreground">
                {formatTimeHMS(elapsed)}
              </span>
              <span className="text-sm text-muted-foreground uppercase tracking-widest">
                {stopwatchRunning ? "Running" : elapsed > 0 ? "Paused" : "Ready"}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button onClick={resetStopwatch} className="w-12 h-12 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-200 flex items-center justify-center" title="Reset">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={toggleStopwatch}
              className={`w-20 h-20 rounded-full text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 ${stopwatchRunning ? "bg-primary/80 hover:bg-primary/70" : "bg-primary hover:bg-primary/90"}`}
            >
              {stopwatchRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 translate-x-0.5" />}
            </button>
            <div className="w-12 h-12" />
          </div>
        </div>
      )}
    </Layout>
  );
}
