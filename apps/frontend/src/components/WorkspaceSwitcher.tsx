"use client";

import { useCallback, useEffect, useState } from "react";
import { socket } from "@/src/lib/socket";
import { Spinner } from "@/src/components/ui/spinner";

type WorkspaceMember = {
  role: string;
  workspace: {
    id: number;
    name: string;
    description?: string | null;
  };
};

type WorkspaceSwitcherProps = {
  onSelect: (workspaceId: number, role: string, workspaceName: string) => void;
  selectedWorkspaceId?: number | null;
  refreshKey?: number;
  onLoaded?: (count: number) => void;
};

export default function WorkspaceSwitcher({
  onSelect,
  selectedWorkspaceId,
  refreshKey = 0,
  onLoaded,
}: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await fetch("http://localhost:3001/workspace", {
        credentials: "include",
      });

      const data = (await res.json()) as WorkspaceMember[];

      if (!res.ok) {
        setError("Failed to load workspaces");
        setWorkspaces([]);
        onLoaded?.(0);
        return;
      }

      setWorkspaces(data);
      onLoaded?.(data.length);

      if (!data.length) {
        return;
      }

      if (selectedWorkspaceId) {
        const selectedWorkspace = data.find(
          (item) => item.workspace.id === selectedWorkspaceId
        );
        if (selectedWorkspace) {
          onSelect(
            selectedWorkspace.workspace.id,
            selectedWorkspace.role,
            selectedWorkspace.workspace.name
          );
          return;
        }
      }

      const firstWorkspace = data[0];
      if (firstWorkspace) {
        onSelect(firstWorkspace.workspace.id, firstWorkspace.role, firstWorkspace.workspace.name);
      }
    } catch {
      setError("Network error while loading workspaces");
      setWorkspaces([]);
      onLoaded?.(0);
    } finally {
      setIsLoading(false);
    }
  }, [onLoaded, onSelect, selectedWorkspaceId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchWorkspaces();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchWorkspaces, refreshKey]);

  useEffect(() => {
    const handleWorkspaceAdded = () => {
      fetchWorkspaces();
    };

    socket.on("workspace:added", handleWorkspaceAdded);
    return () => {
      socket.off("workspace:added", handleWorkspaceAdded);
    };
  }, [fetchWorkspaces]);

  return (
    <div className="rounded-xl border border-[var(--primary)]/20 bg-[#1e1b15] p-4 space-y-3">
      <h3 className="font-semibold text-[var(--primary)]">Your Workspaces</h3>

      {isLoading && (
        <p className="text-sm text-[var(--primary)]/70 inline-flex items-center gap-2">
          <Spinner className="size-4" />
          Loading...
        </p>
      )}

      {!isLoading && error && <p className="text-sm text-red-400">{error}</p>}

      {!isLoading && !error && workspaces.length === 0 && (
        <p className="text-sm text-[var(--primary)]/70">
          You are not in any workspace yet. Join with an invite link or create a
          new workspace.
        </p>
      )}

      {workspaces.map((w) => (
        <button
          key={w.workspace.id}
          onClick={() => onSelect(w.workspace.id, w.role, w.workspace.name)}
          className={`w-full text-left border px-3 py-2 rounded-lg transition ${
            selectedWorkspaceId === w.workspace.id
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--primary)]/20 hover:bg-[var(--primary)]/10"
          }`}
        >
          <p className="font-medium text-[var(--text)]">{w.workspace.name}</p>
          <p className="text-xs text-[var(--accent)]">{w.role}</p>
        </button>
      ))}
    </div>
  );
}