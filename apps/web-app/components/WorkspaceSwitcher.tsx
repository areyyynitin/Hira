"use client";

import { useEffect, useState } from "react";

export default function WorkspaceSwitcher({ onSelect }: any) {
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const res = await fetch("http://localhost:3001/workspace", {
        credentials: "include",
      });

      const data = await res.json();
      setWorkspaces(data);

      if (data.length > 0) {
        onSelect(data[0].workspace.id, data[0].role);
      }
    };

    fetchWorkspaces();
  }, []);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Workspaces</h3>

      {workspaces.map((w: any) => (
        <button
          key={w.workspace.id}
          onClick={() => onSelect(w.workspace.id, w.role)}
          className="w-full text-left border px-3 py-2 rounded hover:bg-gray-100"
        >
          {w.workspace.name}
        </button>
      ))}
    </div>
  );
}