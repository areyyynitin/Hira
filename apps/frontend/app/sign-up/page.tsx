"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signUp } from "../../src/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const redirect = searchParams.get("redirect");
  const redirectPath = redirect?.startsWith("/") ? redirect : "/dashboard";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    const res = await signUp.email({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (res.error) {
      setError(res.error.message || "Something went wrong.");
    } else {
      router.push(redirectPath);
    }
  }

  async function handleGoogleLogin() {
    await signIn.social({
      provider: "google",
      callbackURL: redirectPath,
    });
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1e1b15] border border-[var(--primary)]/30 rounded-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text)]">Sign Up</h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Full Name"
          required
          className="w-full rounded-md border border-[var(--primary)]/30 bg-transparent px-3 py-2 text-[var(--text)]"
        />
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
          minLength={8}
          className="w-full rounded-md border border-[var(--primary)]/30 bg-transparent px-3 py-2 text-[var(--text)]"
        />
        <button
          type="submit"
          className="w-full bg-[var(--secondary)] text-[var(--text)] font-medium rounded-md px-4 py-2"
        >
          Create Account
        </button>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-[var(--primary)]/20"></div>
        <span className="flex-shrink mx-4 text-[var(--primary)] text-sm">OR</span>
        <div className="flex-grow border-t border-[var(--primary)]/20"></div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full bg-transparent text-[var(--text)] border border-[var(--primary)]/30 font-medium rounded-md px-4 py-2 flex items-center justify-center gap-2"
      >
        Continue with Google
      </button>

     
      <p className="text-sm text-[var(--primary)]/80 text-center">
        Already have an account?{" "}
        <Link
          href={`/sign-in?redirect=${encodeURIComponent(redirectPath)}`}
          className="text-[var(--accent)] underline"
        >
          Sign in
        </Link>
      </p>
      </div>
    </main>
  );
}