export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

export interface TimerSettings {
  durations: {
    focus: number; // in seconds
    short_break: number; // in seconds
    long_break: number; // in seconds
  };
  autoAdvance: boolean;
  longBreakInterval: number; // number of focus sessions between long breaks
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  estimate?: number; // number of pomodoro sessions estimated
  completed: number; // number of focus sessions completed
  createdAt: number;
  updatedAt: number;
}

export interface SessionLogEntry {
  id: string;
  timestamp: number;
  mode: PomodoroMode;
  duration: number;
  taskId?: string;
  taskTitle?: string;
}

export interface StorageSchema {
  version: number;
  timerSettings: TimerSettings;
  tasks: Task[];
  activeTaskId?: string;
  sessionLogs: SessionLogEntry[];
  /** Persisted timer state for resuming mid-session */
  timerState?: TimerPersistedState;
}

export interface TimerPersistedState {
  mode: PomodoroMode;
  /**
   * Timestamp (ms) when the current session ends if running.  If null, the timer is paused.
   */
  endTimestamp: number | null;
  isRunning: boolean;
  /** Number of focus sessions completed in current cycle */
  completedFocusSessions: number;
}