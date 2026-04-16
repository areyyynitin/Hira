"use client";

import { useEffect, useState } from "react";

export default function TaskList({ workspaceId, role }: any) {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    const res = await fetch(
      `http://localhost:3001/task/${workspaceId}`,
      { credentials: "include" }
    );

    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    if (workspaceId) fetchTasks();
  }, [workspaceId]);

  const updateStatus = async (taskId: number, status: string) => {
    await fetch(`http://localhost:3001/task/${taskId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    fetchTasks();
  };

  const grouped = {
    TODO: tasks.filter((t: any) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t: any) => t.status === "IN_PROGRESS"),
    DONE: tasks.filter((t: any) => t.status === "DONE"),
  };

  return (
    <div className="grid grid-cols-3 gap-4">

      {Object.entries(grouped).map(([status, items]) => (
        <div key={status} className="bg-gray-100 p-3 rounded">
          <h3 className="font-semibold mb-2">{status}</h3>

          {items.map((task: any) => (
            <div key={task.id} className="bg-white p-2 mb-2 rounded shadow">
              <p className="font-medium">{task.title}</p>

              <p className="text-xs">
                {task.assignees.map((a: any) => a.user.name).join(", ")}
              </p>

              {role === "EMPLOYEE" && (
                <select
                  value={task.status}
                  onChange={(e) =>
                    updateStatus(task.id, e.target.value)
                  }
                  className="mt-2 text-sm"
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}