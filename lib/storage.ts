import type { StorageSchema, TimerSettings, Task, SessionLogEntry } from './types';

const STORAGE_KEY = 'pomodoro_state';
const SCHEMA_VERSION = 1;

const defaultSettings: TimerSettings = {
  durations: {
    focus: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60,
  },
  autoAdvance: false,
  longBreakInterval: 4,
  soundEnabled: false,
  notificationsEnabled: false,
};

const defaultState: StorageSchema = {
  version: SCHEMA_VERSION,
  timerSettings: defaultSettings,
  tasks: [],
  activeTaskId: undefined,
  sessionLogs: [],
  timerState: {
    mode: 'focus',
    endTimestamp: null,
    isRunning: false,
    completedFocusSessions: 0,
  },
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function loadState(): StorageSchema {
  if (isBrowser()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState;
      const parsed: StorageSchema = JSON.parse(raw);
      // Migrate if needed
      if (parsed.version !== SCHEMA_VERSION) {
        return migrate(parsed);
      }
      return parsed;
    } catch (err) {
      console.warn('Failed to load state', err);
      return defaultState;
    }
  }
  return defaultState;
}

export function saveState(state: StorageSchema): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save state', err);
  }
}

/**
 * Migration stub. Extend this when bumping SCHEMA_VERSION.
 */
function migrate(oldState: StorageSchema): StorageSchema {
  // For now simply override version and return defaults merged with old data
  const newState = { ...defaultState, ...oldState };
  newState.version = SCHEMA_VERSION;
  return newState;
}

/**
 * Helper to generate a unique ID. Uses timestamp and random component.
 */
export function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8)
  );
}