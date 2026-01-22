import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPomodoroTimer } from '../lib/timer';

describe('createPomodoroTimer', () => {
  const defaultSettings = {
    durations: { focus: 5, short_break: 2, long_break: 3 },
    autoAdvance: false,
    longBreakInterval: 2,
    soundEnabled: false,
    notificationsEnabled: false,
  } as const;

  it('counts down and stops at zero when autoAdvance is false', () => {
    const timer = createPomodoroTimer(defaultSettings);
    timer.start();
    // Simulate 5 seconds
    timer.tick(timer.getSettings().durations.focus * 1000 + Date.now());
    expect(timer.state.remaining).toBe(0);
    expect(timer.state.isRunning).toBe(false);
  });

  it('auto-advances to break and increments session count', () => {
    const settings = { ...defaultSettings, autoAdvance: true };
    const timer = createPomodoroTimer(settings);
    timer.start();
    // finish focus
    timer.tick(Date.now() + settings.durations.focus * 1000);
    expect(timer.state.mode).toBe('short_break');
    expect(timer.state.isRunning).toBe(false);
    // The completedFocusSessions should be 1
    expect(timer.state.completedFocusSessions).toBe(1);
  });

  it('triggers long break after specified focus sessions', () => {
    const settings = { ...defaultSettings, autoAdvance: true, longBreakInterval: 2 };
    const timer = createPomodoroTimer(settings);
    // First focus
    timer.start();
    timer.tick(Date.now() + settings.durations.focus * 1000);
    // simulate break end by switching manually back to focus
    timer.switchMode('focus');
    // Second focus
    timer.start();
    timer.tick(Date.now() + settings.durations.focus * 1000);
    expect(timer.state.mode).toBe('long_break');
  });

  it('pause and resume preserves remaining time', () => {
    const timer = createPomodoroTimer(defaultSettings);
    timer.start();
    // simulate 2 seconds
    const start = Date.now();
    timer.tick(start + 2000);
    const remainingAfter2 = timer.state.remaining;
    timer.pause();
    // Wait 2 more seconds (should not count)
    timer.tick(start + 4000);
    expect(timer.state.remaining).toBe(remainingAfter2);
    // Resume and finish
    timer.start();
    timer.tick(start + 4000 + remainingAfter2 * 1000);
    expect(timer.state.remaining).toBe(0);
  });

  it('reset sets remaining to full duration and stops timer', () => {
    const timer = createPomodoroTimer(defaultSettings);
    timer.start();
    timer.tick(Date.now() + 2000);
    timer.reset();
    expect(timer.state.remaining).toBe(defaultSettings.durations.focus);
    expect(timer.state.isRunning).toBe(false);
  });
});