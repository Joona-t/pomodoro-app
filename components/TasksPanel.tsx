"use client";
import { useEffect, useState } from "react";
import { usePomodoroTimer } from "../lib/usePomodoroTimer";
import type { Task } from "../lib/types";

interface EditingTaskState {
  id?: string;
  title: string;
  notes?: string;
  estimate?: number;
}

export default function TasksPanel() {
  const {
    tasks,
    activeTaskId,
    addTask,
    updateTask,
    deleteTask,
    setActiveTask,
  } = usePomodoroTimer();

  const [editing, setEditing] = useState<EditingTaskState | null>(null);

  // ✅ Hooks belong INSIDE the component
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  function handleSave() {
    if (!editing) return;
    const { id, title, notes, estimate } = editing;
    if (!title.trim()) {
      setEditing(null);
      return;
    }
    if (id) {
      updateTask(id, { title: title.trim(), notes: notes?.trim(), estimate });
    } else {
      addTask({ title: title.trim(), notes: notes?.trim(), estimate });
    }
    setEditing(null);
  }

  function handleCancel() {
    setEditing(null);
  }

  return (
    <div className="pink-panel p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <button
          className="px-3 py-1 bg-primary text-white rounded focus:outline-none focus:ring"
          onClick={() => setEditing({ title: "", notes: "", estimate: undefined })}
        >
          Add
        </button>
      </div>

      {editing && (
        <div className="border rounded p-3 space-y-2">
          <input
            type="text"
            placeholder="Task title"
            className="w-full p-2 border rounded"
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          />
          <textarea
            placeholder="Notes (optional)"
            className="w-full p-2 border rounded"
            rows={2}
            value={editing.notes || ""}
            onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
          />
          <input
            type="number"
            min={1}
            placeholder="Estimate (pomodoros)"
            className="w-full p-2 border rounded"
            value={editing.estimate ?? ""}
            onChange={(e) =>
              setEditing({
                ...editing,
                estimate: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-primary text-white rounded" onClick={handleSave}>
              Save
            </button>
            <button className="px-3 py-1 bg-gray-300 rounded" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mounted ? (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              active={task.id === activeTaskId}
              onActivate={() => setActiveTask(task.id)}
              onEdit={() =>
                setEditing({
                  id: task.id,
                  title: task.title,
                  notes: task.notes,
                  estimate: task.estimate,
                })
              }
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-600">Loading…</div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  active: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskItem({ task, active, onActivate, onEdit, onDelete }: TaskItemProps) {
  return (
    <li className={`border rounded p-2 flex justify-between items-start ${active ? "border-primary" : ""}`}>
      <div className="flex-1 cursor-pointer" onClick={onActivate}>
        <div className="flex items-center gap-2">
          <input type="radio" checked={active} onChange={onActivate} className="h-4 w-4 mt-1" />
          <span className="font-medium break-words">{task.title}</span>
        </div>
        {task.notes && <p className="text-sm text-gray-600 mt-1 break-words">{task.notes}</p>}
        <div className="text-xs text-gray-500 mt-1">
          {task.completed}
          {typeof task.estimate === "number" ? ` / ${task.estimate}` : ""} sessions
        </div>
      </div>
      <div className="flex gap-2 ml-2">
        <button className="text-blue-600 text-sm underline" onClick={onEdit}>
          Edit
        </button>
        <button className="text-red-600 text-sm underline" onClick={onDelete}>
          Del
        </button>
      </div>
    </li>
  );
}
