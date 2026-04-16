"use client";

import { useEffect, useState } from "react";

export default function Members({
  workspaceId,
  role,
}: {
  workspaceId: number;
  role: string;
}) {
  const [members, setMembers] = useState([]);

  const fetchMembers = async () => {
    const res = await fetch(
      `http://localhost:3001/workspace/${workspaceId}/members`,
      { credentials: "include" }
    );

    const data = await res.json();
    setMembers(data);
  };

  useEffect(() => {
    if (workspaceId) fetchMembers();
  }, [workspaceId]);

  const updateRole = async (memberId: number, newRole: string) => {
    await fetch(`http://localhost:3001/workspace/member/${memberId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    fetchMembers();
  };

  return (
    <div className="border p-4 rounded space-y-3">
      <h2>Members ({members.length})</h2>

      {members.map((m: any) => (
        <div key={m.id} className="flex justify-between border p-2 rounded">
          <div>
            <p>{m.user.name}</p>
            <p className="text-sm text-gray-500">{m.user.email}</p>
          </div>

          {role === "ADMIN" ? (
            <select
              value={m.role}
              onChange={(e) => updateRole(m.id, e.target.value)}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="EMPLOYEE">EMPLOYEE</option>
            </select>
          ) : (
            <span>{m.role}</span>
          )}
        </div>
      ))}
    </div>
  );
}