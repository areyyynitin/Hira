"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "../../src/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const redirect = searchParams.get("redirect");
  const redirectPath = redirect?.startsWith("/") ? redirect : "/dashboard";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await signIn.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (res.error) {
      setError(res.error.message || "Something went wrong.");
    } else {
      router.push(redirectPath);
    }
  }

  async function handleGoogleSignIn() {
    await signIn.social({
      provider: "google",
      callbackURL: redirectPath,
    });
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1e1b15] border border-[var(--primary)]/30 rounded-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text)]">Sign In</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full rounded-md border border-[var(--primary)]/30 bg-transparent px-3 py-2 text-[var(--text)]"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded-md border border-[var(--primary)]/30 bg-transparent px-3 py-2 text-[var(--text)]"
        />
        <button
          type="submit"
          className="w-full bg-[var(--secondary)] text-[var(--text)] font-medium rounded-md px-4 py-2"
        >
          Sign In
        </button>
      </form>
      <button
        onClick={handleGoogleSignIn}
        className="w-full bg-transparent text-[var(--text)] border border-[var(--primary)]/30 font-medium rounded-md px-4 py-2"
      >
        Continue with Google
      </button>
      <p className="text-sm text-[var(--primary)]/80 text-center">
        Don&apos;t have an account?{" "}
        <Link
          href={`/sign-up?redirect=${encodeURIComponent(redirectPath)}`}
          className="text-[var(--accent)] underline"
        >
          Sign up
        </Link>
      </p>
      </div>
    </main>
  );
}