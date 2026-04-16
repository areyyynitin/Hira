"use client";

import { useEffect, useState } from "react";

export default function CreateTask({ workspaceId }: { workspaceId: number }) {
    const [title, setTitle] = useState("");
    const [members, setMembers] = useState([]);
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        const fetchMembers = async () => {
            const res = await fetch(
                `http://localhost:3001/workspace/${workspaceId}/members`,
                { credentials: "include" }
            );

            const data = await res.json();
            setMembers(data);
        };

        if (workspaceId) fetchMembers();
    }, [workspaceId]);

    const toggleUser = (id: string) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id]
        );
    };

    const createTask = async () => {
        await fetch("http://localhost:3001/task", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                workspaceId,
                assigneeIds: selected,
            }),
        });

        setTitle("");
        setSelected([]);

        console.log("Sending assignees:", selected);
    };

    return (
        <div className="border p-4 rounded space-y-2">
            <h3>Create Task</h3>

            <input
                className="border w-full px-2 py-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
            />

            {members.map((m: any) => (
                <label key={m.id} className="block text-sm">
                    <input
                        type="checkbox"

                        checked={selected.includes(m.user.id)}
                        onChange={() => toggleUser(m.user.id)}
                    />
                    {m.user.name}
                </label>
            ))}

            <button
                onClick={createTask}
                className="bg-black text-white px-3 py-1 rounded"
            >
                Create Task
            </button>
        </div>
    );
}