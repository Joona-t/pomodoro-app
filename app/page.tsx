"use client";
import TimerCard from '../components/TimerCard';
import TasksPanel from '../components/TasksPanel';
import SessionLog from '../components/SessionLog';

export default function HomePage() {
  return (
    <div className="w-full max-w-5xl mx-auto grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <TimerCard />
      </div>
      <TasksPanel />
      <SessionLog />
    </div>
  );
}