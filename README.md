# Pomodoro Timer Web App (WIP)

This repository contains a **Work in Progress Pomodoro timer** built with **Next.js (App Router)** and **TypeScript**.  The application provides a clean, mobile‑friendly user experience with persistent local state, task management and session logging.  The codebase is modular and ready to be extended with a backend API in the future.

## Features

### Pomodoro Timer

* **Default durations**: 25 min focus, 5 min short break, 15 min long break.  Users can adjust these on the fly.
* **Controls**: Start, pause, resume and reset the timer.  Switch between focus/short/long modes manually.
* **Auto‑advance**: Optional toggle to automatically jump to the next session when a timer completes.  A long break occurs after every _n_ focus sessions (default = 4) when enabled.
* **Keyboard shortcuts**: Space = start/pause, R = reset, 1 = focus, 2 = short break, 3 = long break.
* **Audio & notifications**: Optional sound and browser notifications can be enabled.  When a session completes, the hook plays a short beep via the Web Audio API and, if permission is granted, shows a desktop notification.

### Tasks

* Add, edit and delete tasks with a title, optional notes and an optional estimate (# of Pomodoro sessions).
* Choose an **active task** to associate with the current focus session.  When a focus session completes, the active task’s completed count increments automatically.
* Simple inline editing and radio‑button selection for active tasks.

### Session Log

* Every completed session is recorded with timestamp, mode, duration and active task (if any).
* Shows **today’s totals** (focus minutes, break minutes and number of focus sessions).
* List of session entries in reverse‑chronological order.
* Buttons to **Clear today** or **Clear all** logs with confirmation.

### Persistence and Storage

* All timer settings, tasks, active task, **timer state** and session logs persist to `localStorage` via a typed helper in `lib/storage.ts`.
  The timer state includes the current mode, end timestamp and running flag so a partially completed session is restored on page refresh.
* A `version` field and migration stub are included to safely evolve the storage schema over time.

### Accessibility & UX

* Minimal, calm UI built with **Tailwind CSS**.
* Responsive layout stacks panels vertically on small screens.
* Form inputs and buttons include focus states and aria‑friendly labels.

## Architecture

The project is organised into a few top‑level folders:

```
pomodoro-app/
├── app/            # Next.js app router entrypoints (layout.tsx, page.tsx, globals.css)
├── components/     # Reusable UI components (TimerCard, TasksPanel, SessionLog)
├── lib/            # Shared logic, types and storage helpers
│   ├── timer.ts            # Pure timer engine that handles countdowns and modes
│   ├── usePomodoroTimer.ts # React hook orchestrating timer, tasks and logs
│   ├── storage.ts          # localStorage persistence with schema versioning
│   └── types.ts            # Type definitions for state objects
├── tests/          # Vitest tests for timer logic
├── public/         # Static assets (empty by default)
├── tailwind.config.ts, postcss.config.js, next.config.js, tsconfig.json
└── README.md
```

### Timer logic

The core countdown and auto‑advance behaviour lives in `lib/timer.ts`.  A `createPomodoroTimer()` factory returns an object with a plain JavaScript state (`mode`, `remaining`, `isRunning`, `completedFocusSessions`) and imperative methods (`start()`, `pause()`, `reset()`, `switchMode()`, `tick()`, `updateSettings()`).  It uses timestamps rather than naïve interval decrements to avoid drift.

The React hook `usePomodoroTimer()` wraps this engine and provides tasks, session logs and persistence.  It exposes state and handlers for components to consume.  A `setInterval` in the hook calls `tick()` every second to update the timer.

### Extending with a backend

Although this project runs entirely on the client, the state is structured so it can be synchronised with an API later.  To integrate a backend you could:

1. Create API endpoints under `/app/api` (or a separate server) to handle CRUD for tasks, settings and logs.
2. Modify `storage.ts` to read/write from the API instead of `localStorage` and fallback to local when offline.
3. Introduce SWR or React Query to keep client state in sync with the server.

## Development

### Prerequisites

You need **Node.js** (≥ 18) and **npm** or **yarn** installed locally.  Clone this repository and run the following commands:

```bash
npm install       # install dependencies
npm run dev       # start the development server on http://localhost:3000
npm run test      # run unit tests with Vitest
npm run build     # build the production application
```

Open `http://localhost:3000` in your browser to use the app.  The `dev` script enables hot reloading.

### Project checklist

The following table summarises the requested features.  Anything not implemented yet is marked as optional for future work.

| Feature                           | Status    |
|----------------------------------|-----------|
| Next.js with App Router & TS     | ✅ done   |
| Tailwind styling & responsive UI | ✅ done   |
| Pomodoro timer logic             | ✅ done   |
| Start/pause/resume/reset controls| ✅ done   |
| Manual mode switching            | ✅ done   |
| Auto‑advance toggle              | ✅ done   |
| Long break interval toggle       | ✅ done   |
| Keyboard shortcuts               | ✅ done   |
| Task CRUD & active task selection| ✅ done   |
| Increment task count on focus end| ✅ done   |
| Session logging & daily totals   | ✅ done   |
| Clear today/all logs             | ✅ done   |
| Persist state to localStorage    | ✅ done   |
| Sound & notifications toggles    | ✅ done   |
| Persist timer mid‑session        | ✅ done   |
| Skip break button                | ✅ done   |
| ESLint & Prettier configuration  | ✅ done   |
| Basic Vitest unit tests          | ✅ done   |
| CI/CD pipeline                   | 🔲 optional|

## Notes

* **Time drift:** The timer uses timestamps to calculate elapsed time, ensuring accuracy even if the browser throttles intervals.
* **Mobile usability:** Panels collapse into a vertical stack on small screens.  Controls are large enough for touch targets.
* **Persistence:** If you change the schema (e.g. adding fields to tasks or settings), bump the `SCHEMA_VERSION` in `storage.ts` and handle migration in the `migrate()` function.

Enjoy your productive sessions!  Feel free to extend this project or hook it up to your own API.
