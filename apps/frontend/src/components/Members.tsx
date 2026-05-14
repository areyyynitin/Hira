"use client";

import { useCallback, useEffect, useState } from "react";
import { socket } from "@/src/lib/socket";
import { Spinner } from "@/src/components/ui/spinner";

type Member = {
  id: number;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

export default function Members({
  workspaceId,
  role,
}: {
  workspaceId: number;
  role: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch(
      `http://localhost:3001/workspace/${workspaceId}/members`,
      { credentials: "include" }
    );

    const data = await res.json();
    setMembers(data);
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchMembers();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchMembers]);

  useEffect(() => {
    if (!workspaceId) return;

    socket.emit("workspace:join", workspaceId);

    const handleWorkspaceChange = (payload: { workspaceId: number }) => {
      if (payload.workspaceId === workspaceId) {
        fetchMembers();
      }
    };

    socket.on("workspace:member_updated", handleWorkspaceChange);
    socket.on("workspace:member_joined", handleWorkspaceChange);

    return () => {
      socket.emit("workspace:leave", workspaceId);
      socket.off("workspace:member_updated", handleWorkspaceChange);
      socket.off("workspace:member_joined", handleWorkspaceChange);
    };
  }, [fetchMembers, workspaceId]);

  const updateRole = async (memberId: number, newRole: string) => {
    await fetch(`http://localhost:3001/workspace/member/${memberId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
  };

  return (
    <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4 space-y-3">
      <h2 className="text-[var(--primary)] font-semibold">Members ({members.length})</h2>
      {isLoading && (
        <div className="inline-flex items-center gap-2 text-xs text-[var(--primary)]/70">
          <Spinner className="size-3" />
          Loading members...
        </div>
      )}

      {!isLoading && members.map((m) => (
        <div key={m.id} className="flex justify-between border border-[var(--primary)]/20 p-2 rounded-lg">
          <div>
            <p className="text-[var(--text)]">{m.user.name}</p>
            <p className="text-xs text-[var(--primary)]/70">{m.user.email}</p>
          </div>

          {role === "ADMIN" ? (
            <select
              value={m.role}
              onChange={(e) => updateRole(m.id, e.target.value)}
              className="rounded border border-[var(--primary)]/30 bg-transparent px-2 py-1 text-xs text-[var(--text)]"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>
          ) : (
            <span className="text-xs text-[var(--accent)]">{m.role}</span>
          )}
        </div>
      ))}
    </div>
  );
}