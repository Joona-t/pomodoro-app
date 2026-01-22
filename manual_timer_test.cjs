// Manual tests for createPomodoroTimer implemented in plain JS.
// This script reimplements the timer logic and runs tests using Node's assert module.

const assert = require('assert');

function createPomodoroTimer(settings) {
  let mode = 'focus';
  let remaining = settings.durations[mode];
  let isRunning = false;
  let sessionStart = null;
  let completedFocusSessions = 0;
  function start() {
    if (isRunning) return;
    isRunning = true;
    sessionStart = Date.now();
  }
  function pause() {
    if (!isRunning) return;
    const now = Date.now();
    const elapsed = Math.floor((now - sessionStart) / 1000);
    remaining = Math.max(0, remaining - elapsed);
    isRunning = false;
    sessionStart = null;
  }
  function reset(newMode) {
    if (newMode) mode = newMode;
    remaining = settings.durations[mode];
    isRunning = false;
    sessionStart = null;
  }
  function switchMode(newMode) {
    mode = newMode;
    remaining = settings.durations[mode];
    isRunning = false;
    sessionStart = null;
  }
  function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
  }
  function tick(now) {
    if (!isRunning) return false;
    const currentTime = now || Date.now();
    const elapsed = Math.floor((currentTime - sessionStart) / 1000);
    const newRemaining = settings.durations[mode] - elapsed;
    if (newRemaining <= 0) {
      remaining = 0;
      isRunning = false;
      sessionStart = null;
      if (mode === 'focus') completedFocusSessions++;
      if (settings.autoAdvance) {
        let nextMode;
        if (mode === 'focus') {
          if (
            settings.longBreakInterval > 0 &&
            completedFocusSessions % settings.longBreakInterval === 0
          )
            nextMode = 'long_break';
          else nextMode = 'short_break';
        } else nextMode = 'focus';
        switchMode(nextMode);
      }
      return true;
    }
    remaining = newRemaining;
    return false;
  }
  return {
    state: {
      get mode() {
        return mode;
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
    },
    start,
    pause,
    reset,
    switchMode,
    updateSettings,
    tick,
  };
}

function runTests() {
  const defaultSettings = {
    durations: { focus: 5, short_break: 2, long_break: 3 },
    autoAdvance: false,
    longBreakInterval: 2,
    soundEnabled: false,
    notificationsEnabled: false,
  };
  // Test 1: countdown stops
  {
    const timer = createPomodoroTimer(defaultSettings);
    timer.start();
    timer.tick(Date.now() + defaultSettings.durations.focus * 1000);
    assert.equal(timer.state.remaining, 0);
    assert.equal(timer.state.isRunning, false);
  }
  // Test 2: auto-advance
  {
    const settings = { ...defaultSettings, autoAdvance: true };
    const timer = createPomodoroTimer(settings);
    timer.start();
    timer.tick(Date.now() + settings.durations.focus * 1000);
    assert.equal(timer.state.mode, 'short_break');
    assert.equal(timer.state.isRunning, false);
    assert.equal(timer.state.completedFocusSessions, 1);
  }
  // Test 3: long break interval
  {
    const settings = {
      ...defaultSettings,
      autoAdvance: true,
      longBreakInterval: 2,
    };
    const timer = createPomodoroTimer(settings);
    timer.start();
    timer.tick(Date.now() + settings.durations.focus * 1000);
    timer.switchMode('focus');
    timer.start();
    timer.tick(Date.now() + settings.durations.focus * 1000);
    assert.equal(timer.state.mode, 'long_break');
  }
  // Test 4: pause/resume
  {
    const timer = createPomodoroTimer(defaultSettings);
    timer.start();
    const start = Date.now();
    timer.tick(start + 2000);
    const rem2 = timer.state.remaining;
    timer.pause();
    timer.tick(start + 4000);
    assert.equal(timer.state.remaining, rem2);
    timer.start();
    timer.tick(start + 4000 + rem2 * 1000);
    assert.equal(timer.state.remaining, 0);
  }
  // Test 5: reset
  {
    const timer = createPomodoroTimer(defaultSettings);
    timer.start();
    timer.tick(Date.now() + 2000);
    timer.reset();
    assert.equal(timer.state.remaining, defaultSettings.durations.focus);
    assert.equal(timer.state.isRunning, false);
  }
  console.log('All manual timer tests passed');
}

runTests();