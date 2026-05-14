"use client";

import { useCallback, useEffect, useState } from "react";
import { socket } from "@/src/lib/socket";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

type Task = {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  createdAt: string;
  assignees: Array<{
    id: number;
    startedAt?: string | null;
    completedAt?: string | null;
    timeSpentSeconds?: number | null;
    user: {
      id: string;
      name: string | null;
    };
  }>;
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string | null;
    };
  }>;
};

type TaskListProps = {
  workspaceId: number;
  role: string;
};

export default function TaskList({ workspaceId, role }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    const res = await fetch(
      `http://localhost:3001/task/${workspaceId}`,
      { credentials: "include" }
    );

    const data = await res.json();
    setTasks(data);
  }, [workspaceId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTasks();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchTasks]);

  useEffect(() => {
    if (!workspaceId) return;

    socket.emit("workspace:join", workspaceId);

    const handleTaskChange = (payload: { workspaceId: number }) => {
      if (payload.workspaceId === workspaceId) {
        fetchTasks();
      }
    };

    socket.on("task:created", handleTaskChange);
    socket.on("task:updated", handleTaskChange);
    socket.on("task:comment_added", handleTaskChange);
    socket.on("workspace:member_updated", handleTaskChange);
    socket.on("workspace:member_joined", handleTaskChange);

    return () => {
      socket.emit("workspace:leave", workspaceId);
      socket.off("task:created", handleTaskChange);
      socket.off("task:updated", handleTaskChange);
      socket.off("task:comment_added", handleTaskChange);
      socket.off("workspace:member_updated", handleTaskChange);
      socket.off("workspace:member_joined", handleTaskChange);
    };
  }, [fetchTasks, workspaceId]);

  const updateStatus = async (taskId: number, status: string) => {
    await fetch(`http://localhost:3001/task/${taskId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const addComment = async (taskId: number) => {
    const content = commentDrafts[taskId]?.trim();
    if (!content) return;

    const res = await fetch(`http://localhost:3001/task/${taskId}/comment`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) return;

    setCommentDrafts((prev) => ({ ...prev, [taskId]: "" }));
    await fetchTasks();
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "Not completed yet";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const grouped = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t) => t.status === "DONE"),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {Object.entries(grouped).map(([status, items]) => (
        <div
          key={status}
          className="rounded-xl border border-[var(--primary)]/20 bg-[var(--background)] p-3"
          onDragOver={(e) => {
            if (role !== "EMPLOYEE") return;
            e.preventDefault();
          }}
          onDrop={() => {
            if (role !== "EMPLOYEE" || dragTaskId === null) return;
            void updateStatus(dragTaskId, status);
            setDragTaskId(null);
          }}
        >
          <h3 className="font-semibold mb-2 text-[var(--primary)]">{status}</h3>

          {items.map((task) => (
            <div
              key={task.id}
              draggable={role === "EMPLOYEE"}
              onDragStart={() => setDragTaskId(task.id)}
              onDragEnd={() => setDragTaskId(null)}
              className="bg-[#1e1b15] border border-[var(--primary)]/20 p-3 mb-3 rounded-lg"
            >
              <p className="font-medium text-[var(--text)]">{task.title}</p>
              {task.description && (
                <p className="text-xs mt-1 text-[var(--primary)]/80">{task.description}</p>
              )}
              <p className="text-[10px] mt-1 text-[var(--primary)]/60">
                Created: {new Date(task.createdAt).toLocaleString()}
              </p>

              <p className="text-xs mt-2 text-[var(--accent)]">
                {task.assignees.map((a) => a.user.name ?? "Unknown").join(", ")}
              </p>

              {(role === "ADMIN" || role === "MANAGER") && (
                <div className="mt-2 rounded border border-[var(--accent)]/40 p-2 text-xs text-[var(--primary)]">
                  {task.assignees.map((a) => (
                    <p key={a.id}>
                      {(a.user.name ?? "Unknown")}: {formatDuration(a.timeSpentSeconds)}
                    </p>
                  ))}
                </div>
              )}

              {role === "EMPLOYEE" && (
                <select
                  value={task.status}
                  onChange={(e) =>
                    updateStatus(task.id, e.target.value)
                  }
                  className="mt-2 text-sm"
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
              )}

              {(role === "ADMIN" || role === "MANAGER") && (
                <div className="mt-3 space-y-2">
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {task.comments.map((comment) => (
                      <p key={comment.id} className="text-xs text-[var(--primary)]/90">
                        <span className="font-medium text-[var(--accent)]">
                          {comment.author.name ?? "Manager"}:
                        </span>{" "}
                        {comment.content}
                      </p>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={commentDrafts[task.id] ?? ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))
                      }
                      placeholder="Add comment"
                      className="w-full rounded border border-[var(--primary)]/30 bg-transparent px-2 py-1 text-xs text-[var(--text)]"
                    />
                    <button
                      onClick={() => void addComment(task.id)}
                      className="rounded bg-[var(--secondary)] px-2 py-1 text-xs text-[var(--text)]"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}