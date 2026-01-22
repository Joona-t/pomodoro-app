import type { PomodoroMode, TimerSettings } from './types';

export interface PomodoroState {
  mode: PomodoroMode;
  remaining: number; // seconds remaining in current session
  isRunning: boolean;
  completedFocusSessions: number; // number of completed focus sessions in current cycle
}

export interface PomodoroTimer {
  state: PomodoroState;
  /** Start or resume the timer */
  start(): void;
  /** Pause the timer */
  pause(): void;
  /** Reset timer to initial durations of the current mode */
  reset(mode?: PomodoroMode): void;
  /** Switch to a given mode manually */
  switchMode(mode: PomodoroMode): void;
  /** Tick the timer. Returns true if session completed and auto-advanced. */
  tick(now?: number): boolean;
  /** Update settings, e.g. durations or toggles */
  updateSettings(settings: TimerSettings): void;
  /** Get current settings */
  getSettings(): TimerSettings;

  /**
   * Resume timer from a given remaining time and mode.  Used to restore state from persistence.
   * @param remainingSeconds Number of seconds left in the session
   * @param mode The mode to resume in
   * @param running Whether the timer should be running
   * @param completed Number of completed focus sessions in current cycle
   */
  resumeFromState(remainingSeconds: number, mode: PomodoroMode, running: boolean, completed: number): void;
}

/**
 * Implementation of a Pomodoro timer that uses timestamps to avoid drift.
 * The caller must invoke tick() regularly (e.g. every second) to update the state.
 */
export function createPomodoroTimer(initialSettings: TimerSettings): PomodoroTimer {
  let settings: TimerSettings = { ...initialSettings };
  let currentMode: PomodoroMode = 'focus';
  let remaining = settings.durations[currentMode];
  let isRunning = false;
  let sessionStartTime: number | null = null; // timestamp when session started/resumed
  let remainingAtStart = remaining; // seconds remaining at the moment we started/resumed
  let completedFocusSessions = 0;

  const state: PomodoroState = {
    get mode() {
      return currentMode;
    },
    get remaining() {
      return remaining;
    },
    get isRunning() {
      return isRunning;
    },
    get completedFocusSessions() {
      return completedFocusSessions;
    },
  } as PomodoroState;

  function start() {
    if (isRunning) return;
    isRunning = true;
    sessionStartTime = Date.now();
    remainingAtStart = remaining; // <-- key line: resume uses current remaining
  }
  

  function pause() {
    if (!isRunning) return;
    if (sessionStartTime !== null) {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartTime) / 1000);
      remaining = Math.max(0, remainingAtStart - elapsed);
    }
    isRunning = false;
    sessionStartTime = null;
  }
  

  function reset(mode: PomodoroMode = currentMode) {
    isRunning = false;
    currentMode = mode;
    remaining = settings.durations[currentMode];
    remainingAtStart = remaining;
    sessionStartTime = null;
  }

  function switchMode(mode: PomodoroMode) {
    // manual switch resets session count for focus sessions
    currentMode = mode;
    remaining = settings.durations[currentMode];
    remainingAtStart = remaining;
    isRunning = false;
    sessionStartTime = null;
  }

  function updateSettings(newSettings: TimerSettings) {
    settings = { ...settings, ...newSettings, durations: { ...newSettings.durations } };
    // update remaining time if current mode duration changed and timer not running
    if (!isRunning) {
      remaining = settings.durations[currentMode];
      remainingAtStart = remaining;
    }
  }

  function getSettings() {
    return settings;
  }

  /**
   * Called regularly to update remaining time. If session ends, auto-advance based on settings
   * and return true to indicate completion.
   */
  function tick(now?: number): boolean {
    if (!isRunning) return false;
    const currentTime = now ?? Date.now();
    if (sessionStartTime === null) {
      sessionStartTime = currentTime;
      remainingAtStart = remaining; // safety for weird cases
    }
    const elapsed = Math.floor((currentTime - sessionStartTime) / 1000);
    const newRemaining = remainingAtStart - elapsed;
    if (newRemaining <= 0) {
      // session completed
      remaining = 0;
      isRunning = false;
      sessionStartTime = null;
      // update completedFocusSessions
      if (currentMode === 'focus') {
        completedFocusSessions += 1;
      }
      // determine next mode
      let nextMode: PomodoroMode = currentMode;
      if (settings.autoAdvance) {
        if (currentMode === 'focus') {
          // decide break type
          if (settings.longBreakInterval > 0 && completedFocusSessions % settings.longBreakInterval === 0) {
            nextMode = 'long_break';
          } else {
            nextMode = 'short_break';
          }
        } else {
          // after any break, next is focus
          nextMode = 'focus';
        }
        switchMode(nextMode);
      }
      return true;
    }
    remaining = newRemaining;
    return false;
  }

  /**
   * Manually set the timer state. This is used when restoring persisted state.
   */
  function resumeFromState(
    remainingSeconds: number,
    mode: PomodoroMode,
    running: boolean,
    completed: number
  ) {
    currentMode = mode;
    remaining = remainingSeconds;
    remainingAtStart = remainingSeconds; // <-- NEW: critical
    completedFocusSessions = completed;
    isRunning = running;
    sessionStartTime = running ? Date.now() : null; // <-- start counting from now
  }

  return {
    state,
    start,
    pause,
    reset,
    switchMode,
    tick,
    updateSettings,
    getSettings,
    resumeFromState,
  };
}