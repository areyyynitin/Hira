"use client";

import { useState } from "react";

export default function CreateWorkspace() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createWorkspace = async () => {
    const res = await fetch("http://localhost:3001/api/v1/workspace", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // IMPORTANT (Better Auth session cookie)
      body: JSON.stringify({
        name,
        description,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    console.log("Workspace created:", data);
  };

  return (
    <div>
      <input
        placeholder="Workspace name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button onClick={createWorkspace}>
        Create Workspace
      </button>
    </div>
  );
}