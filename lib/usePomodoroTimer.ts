/*
 * React hook that encapsulates the pomodoro timer along with tasks and session logs.
 * This hook orchestrates the timer engine, task management and persistence through localStorage.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPomodoroTimer } from './timer';
import {
  generateId,
  loadState,
  saveState,
} from './storage';
import type {
  PomodoroMode,
  StorageSchema,
  Task,
  SessionLogEntry,
  TimerSettings,
} from './types';

export interface UsePomodoroTimerReturn {
  mode: PomodoroMode;
  remaining: number;
  isRunning: boolean;
  settings: TimerSettings;
  tasks: Task[];
  activeTaskId?: string;
  sessionLogs: SessionLogEntry[];
  todayTotals: {
    focusMinutes: number;
    focusSessions: number;
    breakMinutes: number;
  };
  // Timer controls
  start: () => void;
  pause: () => void;
  reset: () => void;
  switchMode: (mode: PomodoroMode) => void;
  updateSettings: (settings: Partial<TimerSettings>) => void;
  // Task management
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  setActiveTask: (id?: string) => void;
  // Logs
  clearTodayLogs: () => void;
  clearAllLogs: () => void;

  /** Skip current break and go back to focus. */
  skip: () => void;
}

export function usePomodoroTimer(): UsePomodoroTimerReturn {
  // Load persisted state
  const [state, setState] = useState<StorageSchema>(() => loadState());
  // Timer engine reference
  const timerRef = useRef(createPomodoroTimer(state.timerSettings));
  // Derived values from timer engine
  const [timerVersion, setTimerVersion] = useState(0);

  /**
   * Persist current timer state (mode, end timestamp, running flag and completed focus count).
   */
  const updatePersistedTimerState = useCallback(() => {
    const { mode, remaining, isRunning, completedFocusSessions } = timerRef.current.state;
    const endTimestamp = isRunning ? Date.now() + remaining * 1000 : null;
    setState((prev) => ({
      ...prev,
      timerState: { mode, endTimestamp, isRunning, completedFocusSessions },
    }));
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Listen to timer and update state regularly
  useEffect(() => {
    const interval = setInterval(() => {
      const completed = timerRef.current.tick();
      if (completed) {
        handleSessionComplete(timerRef.current.state.mode === 'focus');
      }
      // Persist timer state
      updatePersistedTimerState();
      // Force re-render by updating a dummy state
      setTimerVersion((v) => v + 1);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePersistedTimerState]);

  // On mount, restore persisted timer state if present
  useEffect(() => {
    const ts = state.timerState;
    if (!ts) return;
    const mode = ts.mode;
    let remainingSec: number;
    if (ts.isRunning && ts.endTimestamp) {
      const diff = Math.ceil((ts.endTimestamp - Date.now()) / 1000);
      remainingSec = diff > 0 ? diff : 0;
    } else {
      // if paused or no endTimestamp, use remaining from durations
      remainingSec = Math.max(0, timerRef.current.getSettings().durations[mode]);
    }
    // Resume timer engine from persisted state
    timerRef.current.resumeFromState(remainingSec, mode, ts.isRunning && remainingSec > 0, ts.completedFocusSessions);
    // Force re-render
    setTimerVersion((v) => v + 1);
  }, []);

  // handle session complete
  const handleSessionComplete = useCallback(
    (wasFocus: boolean) => {
      const now = Date.now();
      const { mode } = timerRef.current.state;
      const duration = state.timerSettings.durations[mode];
      // Play sound/notification at session end
      if (state.timerSettings.soundEnabled) {
        try {
          const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } catch (e) {
          console.warn('Sound playback failed', e);
        }
      }
      if (state.timerSettings.notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          const title = mode === 'focus' ? 'Focus session complete!' : 'Break complete!';
          const body = mode === 'focus' ? 'Take a break.' : 'Back to focus.';
          new Notification(title, { body });
        }
      }

      // Increment completed count on active task if a focus session finished
      setState((prev) => {
        let tasks = prev.tasks;
        if (wasFocus && prev.activeTaskId) {
          tasks = prev.tasks.map((t) =>
            t.id === prev.activeTaskId ? { ...t, completed: t.completed + 1, updatedAt: now } : t
          );
        }
        // Add log entry
        const newLog: SessionLogEntry = {
          id: generateId(),
          timestamp: now,
          mode,
          duration,
          taskId: wasFocus ? prev.activeTaskId : undefined,
          taskTitle: wasFocus
            ? tasks.find((t) => t.id === prev.activeTaskId)?.title
            : undefined,
        };
        return {
          ...prev,
          tasks,
          sessionLogs: [...prev.sessionLogs, newLog],
        };
      });
    },
    [state.timerSettings]
  );

  // Derived today totals
  const todayTotals = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTs = startOfDay.getTime();
    let focusMinutes = 0;
    let focusSessions = 0;
    let breakMinutes = 0;
    state.sessionLogs.forEach((entry) => {
      if (entry.timestamp >= startTs) {
        const minutes = entry.duration / 60;
        if (entry.mode === 'focus') {
          focusMinutes += minutes;
          focusSessions += 1;
        } else {
          breakMinutes += minutes;
        }
      }
    });
    return { focusMinutes, focusSessions, breakMinutes };
  }, [state.sessionLogs, timerVersion]);

  // Timer control handlers
  const start = useCallback(() => {
    timerRef.current.start();
    updatePersistedTimerState();
    setTimerVersion((v) => v + 1);
  }, []);

  const pause = useCallback(() => {
    timerRef.current.pause();
    updatePersistedTimerState();
    setTimerVersion((v) => v + 1);
  }, []);

  const reset = useCallback(() => {
    timerRef.current.reset();
    updatePersistedTimerState();
    setTimerVersion((v) => v + 1);
  }, []);

  const switchMode = useCallback((mode: PomodoroMode) => {
    timerRef.current.switchMode(mode);
    updatePersistedTimerState();
    setTimerVersion((v) => v + 1);
  }, []);

  const updateSettings = useCallback((partial: Partial<TimerSettings>) => {
    setState((prev) => {
      // handle notification permission if toggling notifications
      let notificationsEnabled = prev.timerSettings.notificationsEnabled;
      if (partial.notificationsEnabled !== undefined) {
        if (partial.notificationsEnabled) {
          // request permission
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              notificationsEnabled = true;
            } else if (Notification.permission === 'default') {
              Notification.requestPermission().then((perm) => {
                if (perm === 'granted') {
                  // update state asynchronously after permission is granted
                  setState((p) => ({
                    ...p,
                    timerSettings: { ...p.timerSettings, notificationsEnabled: true },
                  }));
                }
              });
              notificationsEnabled = false;
            } else {
              // denied
              notificationsEnabled = false;
              alert('Notification permission is denied. Please enable it in your browser settings.');
            }
          }
        } else {
          notificationsEnabled = false;
        }
      }
      const newSettings: TimerSettings = {
        ...prev.timerSettings,
        ...partial,
        durations: {
          ...prev.timerSettings.durations,
          ...partial.durations,
        },
        notificationsEnabled,
      };
      timerRef.current.updateSettings(newSettings);
      return { ...prev, timerSettings: newSettings };
    });
    // update persisted timer state when settings change (duration changes may adjust remaining)
    updatePersistedTimerState();
  }, []);

  // Task operations
  const addTask = useCallback(
    (task: Omit<Task, 'id' | 'completed' | 'createdAt' | 'updatedAt'>) => {
      const now = Date.now();
      const newTask: Task = {
        ...task,
        id: generateId(),
        completed: 0,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, newTask],
      }));
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id'>>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      ),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => {
      const newTasks = prev.tasks.filter((t) => t.id !== id);
      const activeTaskId = prev.activeTaskId === id ? undefined : prev.activeTaskId;
      return { ...prev, tasks: newTasks, activeTaskId };
    });
  }, []);

  const setActiveTask = useCallback((id?: string) => {
    setState((prev) => ({ ...prev, activeTaskId: id }));
  }, []);

  // Log clearing
  const clearTodayLogs = useCallback(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTs = startOfDay.getTime();
    setState((prev) => ({
      ...prev,
      sessionLogs: prev.sessionLogs.filter((entry) => entry.timestamp < startTs),
    }));
  }, []);

  const clearAllLogs = useCallback(() => {
    if (!confirm('Are you sure you want to clear all logs?')) return;
    setState((prev) => ({ ...prev, sessionLogs: [] }));
  }, []);

  /**
   * Skip the current session. For breaks it switches immediately back to focus.
   */
  const skip = useCallback(() => {
    const currentMode = timerRef.current.state.mode;
    if (currentMode === 'short_break' || currentMode === 'long_break') {
      // We consider skipping break does not add a log entry.
      timerRef.current.switchMode('focus');
      updatePersistedTimerState();
      setTimerVersion((v) => v + 1);
    }
  }, [updatePersistedTimerState]);

  return {
    mode: timerRef.current.state.mode,
    remaining: timerRef.current.state.remaining,
    isRunning: timerRef.current.state.isRunning,
    settings: state.timerSettings,
    tasks: state.tasks,
    activeTaskId: state.activeTaskId,
    sessionLogs: state.sessionLogs,
    todayTotals,
    start,
    pause,
    reset,
    switchMode,
    updateSettings,
    addTask,
    updateTask,
    deleteTask,
    setActiveTask,
    clearTodayLogs,
    clearAllLogs,
    skip,
  };
}