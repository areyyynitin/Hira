"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateWorkspaceProps = {
  onCreated?: (workspaceId: number, role: string) => void;
};

export default function CreateWorkspace({ onCreated }: CreateWorkspaceProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const createWorkspace = async () => {
    setError("");
    setInviteLink("");

    if (!name.trim()) {
      setError("Workspace name required");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:3001/workspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create workspace");
        return;
      }

      const createdWorkspaceId = data.workspace?.id as number | undefined;

      if (!createdWorkspaceId) {
        setError("Workspace created, but ID was missing in response");
        return;
      }

      const inviteRes = await fetch(
        `http://localhost:3001/workspace/${createdWorkspaceId}/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            role: "EMPLOYEE",
          }),
        }
      );

      const inviteData = await inviteRes.json();

      if (inviteRes.ok && inviteData.inviteLink) {
        setInviteLink(inviteData.inviteLink);
      }

      setName("");
      setDescription("");
      onCreated?.(createdWorkspaceId, "ADMIN");

      if (!onCreated) {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error while creating workspace");
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-[var(--text)]">Create Workspace</h2>

      <input
        className="border border-[var(--primary)]/30 rounded-lg px-3 py-2 w-full bg-transparent text-[var(--text)]"
        placeholder="Workspace name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border border-[var(--primary)]/30 rounded-lg px-3 py-2 w-full bg-transparent text-[var(--text)]"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button
        onClick={createWorkspace}
        className="bg-[var(--secondary)] text-[var(--text)] px-3 py-2 rounded-lg disabled:opacity-70"
        disabled={isLoading}
      >
        {isLoading ? "Creating..." : "Create Workspace"}
      </button>

      {error && <p className="text-sm text-red-400">{error} </p>}

      {inviteLink && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--accent)]">
            Invite link generated. Share this with your teammates:
          </p>
          <div className="flex gap-2">
            <input
              className="border border-[var(--primary)]/30 rounded-lg px-2 py-1 w-full text-sm bg-transparent"
              value={inviteLink}
              readOnly
            />
            <button
              onClick={copyInviteLink}
              className="border border-[var(--primary)]/30 rounded-lg px-3 py-1 text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}