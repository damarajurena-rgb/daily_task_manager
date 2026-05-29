import { useLocation, Link } from "wouter";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { useTimer, formatTime, formatTimeHMS } from "@/context/timer-context";

export function FloatingTimer() {
  const {
    timerMode,
    remaining, running, phase, done, toggleRun, reset, totalSeconds,
    elapsed, stopwatchRunning, toggleStopwatch, resetStopwatch,
  } = useTimer();
  const [location] = useLocation();

  const isOnTimerPage = location === "/timer";

  const countdownActive = running || (remaining < totalSeconds && remaining > 0 && !done);
  const stopwatchActive = stopwatchRunning || elapsed > 0;

  if (isOnTimerPage) return null;
  if (timerMode === "countdown" && !countdownActive && !done) return null;
  if (timerMode === "stopwatch" && !stopwatchActive) return null;

  const isBreak = phase === "break";
  const accentColor = timerMode === "stopwatch"
    ? "hsl(var(--primary))"
    : isBreak ? "hsl(160 40% 50%)" : "hsl(var(--primary))";
  const bgAccent = timerMode === "stopwatch"
    ? "hsl(var(--primary) / 0.15)"
    : isBreak ? "hsl(160 40% 50% / 0.15)" : "hsl(var(--primary) / 0.15)";

  const C = 2 * Math.PI * 16;
  const ringOffset = timerMode === "stopwatch"
    ? C * (1 - ((elapsed % 3600) / 3600))
    : C * (1 - (totalSeconds > 0 ? 1 - remaining / totalSeconds : 1));

  const displayTime = timerMode === "stopwatch"
    ? formatTimeHMS(elapsed)
    : done ? "Done" : formatTime(remaining);

  const label = timerMode === "stopwatch"
    ? (stopwatchRunning ? "Running" : "Paused")
    : done ? "Time's up" : isBreak ? "Break" : "Focus";

  const onToggle = timerMode === "stopwatch" ? toggleStopwatch : toggleRun;
  const onReset = timerMode === "stopwatch" ? resetStopwatch : reset;
  const isRunning = timerMode === "stopwatch" ? stopwatchRunning : running;

  return (
    <div className="fixed left-5 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300" style={{ bottom: "5.5rem" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-sm"
        style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--card-border))" }}
      >
        {/* Mini ring */}
        <Link href="/timer" className="relative w-10 h-10 flex-shrink-0 cursor-pointer" title="Go to Timer">
          <svg viewBox="0 0 40 40" className="-rotate-90 w-10 h-10">
            <circle cx="20" cy="20" r="16" fill="none" stroke={bgAccent} strokeWidth="3" />
            <circle
              cx="20" cy="20" r="16" fill="none" stroke={accentColor} strokeWidth="3"
              strokeLinecap="round" strokeDasharray={C} strokeDashoffset={ringOffset}
              style={{ transition: isRunning ? "stroke-dashoffset 1s linear" : "stroke-dashoffset 0.3s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Timer className="w-3.5 h-3.5" style={{ color: accentColor }} />
          </div>
        </Link>

        {/* Time display */}
        <div className="flex flex-col min-w-[64px]">
          <span
            className="font-mono text-base font-semibold tabular-nums leading-none"
            style={{ color: done ? accentColor : "hsl(var(--foreground))" }}
          >
            {displayTime}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {(timerMode === "stopwatch" || !done) && (
            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95"
              style={{ background: accentColor }}
            >
              {isRunning
                ? <Pause className="w-3.5 h-3.5 text-white" />
                : <Play className="w-3.5 h-3.5 text-white translate-x-px" />
              }
            </button>
          )}
          <button
            onClick={onReset}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
