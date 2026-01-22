"use client";
import { usePomodoroTimer } from '../lib/usePomodoroTimer';
import { useState } from 'react';

export default function SessionLog() {
  const {
    sessionLogs,
    todayTotals,
    clearTodayLogs,
    clearAllLogs,
  } = usePomodoroTimer();
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const { focusMinutes, focusSessions, breakMinutes } = todayTotals;

  const sortedLogs = [...sessionLogs].sort((a, b) => b.timestamp - a.timestamp);

  function handleClearAll() {
    if (confirmClearAll) {
      clearAllLogs();
      setConfirmClearAll(false);
    } else {
      setConfirmClearAll(true);
      setTimeout(() => setConfirmClearAll(false), 3000);
    }
  }

  return (
    <div className="bg-surface-muted p-4 rounded-lg shadow flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Session Log</h3>
      <div className="text-sm text-gray-700 flex flex-col gap-1">
        <span>Today: {focusMinutes.toFixed(1)} min focus ({focusSessions} sessions), {breakMinutes.toFixed(1)} min break</span>
        <div className="flex gap-2 mt-2">
          <button
            className="px-2 py-1 bg-gray-300 rounded text-sm"
            onClick={clearTodayLogs}
          >
            Clear Today
          </button>
          <button
            className="px-2 py-1 bg-gray-300 rounded text-sm"
            onClick={handleClearAll}
          >
            {confirmClearAll ? 'Confirm All?' : 'Clear All'}
          </button>
        </div>
      </div>
      <ul className="space-y-2 max-h-80 overflow-y-auto text-sm">
        {sortedLogs.map((entry) => (
          <li key={entry.id} className="border rounded p-2 flex justify-between">
            <div>
              <div className="font-medium capitalize">
                {entry.mode === 'focus'
                  ? 'Focus'
                  : entry.mode === 'short_break'
                  ? 'Short Break'
                  : 'Long Break'}{' '}
                - {entry.duration / 60} min
              </div>
              <div className="text-gray-600">
                {new Date(entry.timestamp).toLocaleTimeString()}
                {entry.taskTitle ? ` – ${entry.taskTitle}` : ''}
              </div>
            </div>
          </li>
        ))}
        {sortedLogs.length === 0 && (
          <li className="text-center text-gray-500">No sessions logged yet</li>
        )}
      </ul>
    </div>
  );
}