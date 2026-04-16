"use client";

import { useState } from "react";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import Members from "@/components/Members";
import CreateTask from "@/components/CreateTask";
import TaskList from "@/components/TaskList";
import { useSession } from "@/src/lib/auth-client";

export default function DashboardPage() {
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const { data: session } = useSession();

  return (
  <>
  <div className="p-6 space-y-4">

  <div className="flex justify-between items-center border-b pb-3">
    <h1 className="text-xl font-bold">Dashboard</h1>

    {session?.user && role && (
      <div className="text-sm text-right">
        <p className="font-medium">{session.user.name}</p>
        <p className="text-gray-500">{role}</p>
      </div>
    )}
  </div>

  <div className="grid grid-cols-4 gap-4">

    {/* Sidebar */}
    <div>
      <WorkspaceSwitcher
        onSelect={(id: number, role: string) => {
          setWorkspaceId(id);
          setRole(role);
        }}
      />
    </div>

    <div className="col-span-3 space-y-4">

      {role === "ADMIN" && workspaceId && (
        <Members workspaceId={workspaceId} role={role} />
      )}

      {role !== "EMPLOYEE" && workspaceId && (
        <CreateTask workspaceId={workspaceId} />
      )}

      {workspaceId && <TaskList workspaceId={workspaceId} role={role!} />}

    </div>
  </div>
</div>
  </>
  );
}