"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvitePage() {
  const { token } = useParams();
  const router = useRouter();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const joinWorkspace = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/workspace/join/${token}`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Something went wrong");
          return;
        }

        if (data.alreadyJoined) {
          setStatus("success");
          setMessage("You are already a member");
          return;
        }

        if (data.success) {
          setStatus("success");
          setMessage("Joined successfully 🎉");

          // optional redirect after 2 sec
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        }
      } catch (err) {
        setStatus("error");
        setMessage("Network error");
      }
    };

    if (token) joinWorkspace();
  }, [token, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="border rounded-lg p-6 text-center space-y-3">

        {status === "loading" && <p>Joining workspace...</p>}

        {status === "success" && (
          <p className="text-green-600">{message}</p>
        )}

        {status === "error" && (
          <p className="text-red-600">{message}</p>
        )}

      </div>
    </div>
  );
}