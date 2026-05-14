"use client";

import { useCallback, useEffect, useState } from "react";
import { socket } from "@/src/lib/socket";

type WorkspaceMember = {
    id: number;
    role: "ADMIN" | "MANAGER" | "EMPLOYEE";
    user: {
        id: string;
        name: string | null;
    };
};

export default function CreateTask({ workspaceId }: { workspaceId: number }) {
    const [title, setTitle] = useState("");
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [selected, setSelected] = useState<string[]>([]);

    const fetchMembers = useCallback(async () => {
        const res = await fetch(
            `http://localhost:3001/workspace/${workspaceId}/members`,
            { credentials: "include" }
        );

        const data = await res.json();
        setMembers(data);
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

    const toggleUser = (id: string) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const createTask = async () => {
        const res = await fetch("http://localhost:3001/task", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                workspaceId,
                assigneeIds: selected,
            }),
        });

        if (!res.ok) return;

        setTitle("");
        setSelected([]);
    };

    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-[var(--primary)]">Assign Task</h3>

            <input
                className="w-full rounded-lg border border-[var(--primary)]/35 bg-transparent px-3 py-2 text-[var(--text)]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
            />

            {members.map((m) => (
                <label key={m.id} className="block text-sm text-[var(--primary)]">
                    <input
                        type="checkbox"

                        checked={selected.includes(m.user.id)}
                        onChange={() => toggleUser(m.user.id)}
                        className="mr-2 accent-[var(--accent)]"
                    />
                    {m.user.name ?? "Unknown"}
                </label>
            ))}

            <button
                onClick={createTask}
                className="rounded-lg bg-[var(--secondary)] px-3 py-2 text-[var(--text)]"
            >
                Assign Task
            </button>
        </div>
    );
}