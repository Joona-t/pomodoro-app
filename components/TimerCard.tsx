"use client";
import { useEffect } from 'react';
import { usePomodoroTimer } from '../lib/usePomodoroTimer';
import type { PomodoroMode } from '../lib/types';

/**
 * TimerCard displays the pomodoro timer and controls.
 * Keyboard shortcuts:
 *  Space: start/pause
 *  R: reset
 *  1: focus
 *  2: short break
 *  3: long break
 */
export default function TimerCard() {
  const {
    mode,
    remaining,
    isRunning,
    settings,
    start,
    pause,
    reset,
    switchMode,
    updateSettings,
    skip,
    complete,
  } = usePomodoroTimer();

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;

  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  ) {
    return;
  }
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          isRunning ? pause() : start();
          break;
        case 'KeyR':
          e.preventDefault();
          reset();
          break;
        case 'Digit1':
          e.preventDefault();
          switchMode('focus');
          break;
        case 'Digit2':
          e.preventDefault();
          switchMode('short_break');
          break;
        case 'Digit3':
          e.preventDefault();
          switchMode('long_break');
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRunning, pause, start, reset, switchMode]);

  const setDuration = (mode: PomodoroMode, minutes: number) => {
    updateSettings({
      durations: {
        ...settings.durations,
        [mode]: minutes * 60,
      },
    });
  };

  return (
    <div className="relative">
      <div className="focus-glow" />
  
      <div className="pink-panel p-6 flex flex-col items-center gap-4 relative z-10">
        <h2 className="text-5xl font-semibold capitalize">
          {mode === 'focus'
            ? 'Focus'
            : mode === 'short_break'
            ? 'Short Break'
            : 'Long Break'}
        </h2>
  
      <div className="text-6xl font-mono tabular-nums">
        {formatTime(remaining)}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          className="px-4 py-2 bg-primary text-white rounded focus:outline-none focus:ring"
          onClick={isRunning ? pause : start}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          className="px-4 py-2 bg-gray-300 rounded focus:outline-none focus:ring"
          onClick={reset}
        >
          Reset
        </button>
        {mode === 'focus' ? (
          <button
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded focus:outline-none focus:ring focus:ring-pink-500"
            onClick={complete}
          >
            Skip
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded focus:outline-none focus:ring focus:ring-pink-500"
            onClick={skip}
          >
            Skip
          </button>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <ModeButton
          label="Focus"
          active={mode === 'focus'}
          onClick={() => switchMode('focus')}
        />
        <ModeButton
          label="Short"
          active={mode === 'short_break'}
          onClick={() => switchMode('short_break')}
        />
        <ModeButton
          label="Long"
          active={mode === 'long_break'}
          onClick={() => switchMode('long_break')}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
        {(['focus', 'short_break', 'long_break'] as PomodoroMode[]).map((m) => (
          <div key={m} className="flex flex-col items-center">
            <label htmlFor={`${m}-duration`} className="capitalize">
              {m === 'focus' ? 'Focus' : m === 'short_break' ? 'Short' : 'Long'}
            </label>
            <input
              id={`${m}-duration`}
              type="number"
              min={1}
              className="w-16 text-center border rounded p-1"
              value={Math.round(settings.durations[m] / 60)}
              onChange={(e) => setDuration(m, parseInt(e.target.value || '0', 10))}
            />
          </div>
        ))}
      </div>
       {/* controls temporarily removed */}
      </div>
    </div>
  );

    
}

interface ModeButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function ModeButton({ label, active, onClick }: ModeButtonProps) {
  return (
    <button
      className={`px-3 py-1 rounded focus:outline-none focus:ring ${active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
