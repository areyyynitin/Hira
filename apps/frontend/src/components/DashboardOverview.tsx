"use client";

import { useCallback, useEffect, useState } from "react";
import { socket } from "@/src/lib/socket";
import { Spinner } from "@/src/components/ui/spinner";

type Member = {
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
};

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

type Task = {
  status: TaskStatus;
};

type DashboardOverviewProps = {
  workspaceId: number;
  workspaceName: string;
};

export default function DashboardOverview({
  workspaceId,
  workspaceName,
}: DashboardOverviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeCount, setEmployeeCount] = useState(0);
  const [managerCount, setManagerCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [todoCount, setTodoCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  const fetchOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const [membersRes, tasksRes] = await Promise.all([
        fetch(`http://localhost:3001/workspace/${workspaceId}/members`, {
          credentials: "include",
        }),
        fetch(`http://localhost:3001/task/${workspaceId}`, {
          credentials: "include",
        }),
      ]);

      if (!membersRes.ok || !tasksRes.ok) {
        setError("Failed to load dashboard stats");
        return;
      }

      const members = (await membersRes.json()) as Member[];
      const tasks = (await tasksRes.json()) as Task[];

      const employees = members.filter((member) => member.role === "EMPLOYEE").length;
      const managers = members.filter((member) => member.role === "MANAGER").length;
      const admins = members.filter((member) => member.role === "ADMIN").length;

      const todo = tasks.filter((task) => task.status === "TODO").length;
      const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
      const done = tasks.filter((task) => task.status === "DONE").length;

      setEmployeeCount(employees);
      setManagerCount(managers);
      setAdminCount(admins);
      setTotalTasks(tasks.length);
      setTodoCount(todo);
      setInProgressCount(inProgress);
      setDoneCount(done);
    } catch {
      setError("Network error while loading dashboard stats");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    socket.emit("workspace:join", workspaceId);

    const handleWorkspaceChange = (payload: { workspaceId: number }) => {
      if (payload.workspaceId === workspaceId) {
        void fetchOverview();
      }
    };

    socket.on("workspace:member_updated", handleWorkspaceChange);
    socket.on("workspace:member_joined", handleWorkspaceChange);
    socket.on("task:created", handleWorkspaceChange);
    socket.on("task:updated", handleWorkspaceChange);

    return () => {
      socket.emit("workspace:leave", workspaceId);
      socket.off("workspace:member_updated", handleWorkspaceChange);
      socket.off("workspace:member_joined", handleWorkspaceChange);
      socket.off("task:created", handleWorkspaceChange);
      socket.off("task:updated", handleWorkspaceChange);
    };
  }, [fetchOverview, workspaceId]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-6 inline-flex items-center gap-2 text-sm text-[var(--primary)]/80">
        <Spinner className="size-4" />
        Loading dashboard stats...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/40 bg-[#1e1b15] p-6 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4">
        <h2 className="text-lg font-semibold text-[var(--primary)]">Workspace Dashboard</h2>
        <p className="text-sm text-[var(--primary)]/70 mt-1">
          Quick overview for {workspaceName}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4">
          <p className="text-sm text-[var(--primary)]/70">Employees</p>
          <p className="text-2xl font-bold text-[var(--text)]">{employeeCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4">
          <p className="text-sm text-[var(--primary)]/70">Managers</p>
          <p className="text-2xl font-bold text-[var(--text)]">{managerCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4">
          <p className="text-sm text-[var(--primary)]/70">Admins</p>
          <p className="text-2xl font-bold text-[var(--text)]">{adminCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4">
          <p className="text-sm text-[var(--primary)]/70">Total Tasks</p>
          <p className="text-2xl font-bold text-[var(--text)]">{totalTasks}</p>
        </div>
        <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4">
          <p className="text-sm text-[var(--primary)]/70">In Progress</p>
          <p className="text-2xl font-bold text-[var(--text)]">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4">
          <p className="text-sm text-[var(--primary)]/70">Completed</p>
          <p className="text-2xl font-bold text-[var(--text)]">{doneCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4 text-sm text-[var(--primary)]/85">
        TODO tasks remaining: <span className="text-[var(--accent)] font-semibold">{todoCount}</span>
      </div>
    </div>
  );
}
