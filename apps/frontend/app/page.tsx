"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex items-center justify-center h-screen bg-[var(--background)] text-[var(--text)]">
      <div className="flex gap-4">
        <button
          onClick={() => router.push("/sign-up")}
          className="bg-[var(--secondary)] text-[var(--text)] font-medium px-6 py-2 rounded-md"
        >
          Sign Up
        </button>
        <button
          onClick={() => router.push("/sign-in")}
          className="border border-[var(--primary)]/30 text-[var(--text)] font-medium px-6 py-2 rounded-md"
        >
          Sign In
        </button>
      </div>
    </main>
  );
}