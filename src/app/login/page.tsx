"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const activated = searchParams.get("activated") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      window.location.href = callbackUrl;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 text-slate-800 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-6">
          Log in
        </h1>
        {activated && (
          <p className="text-base text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2 mb-4 text-center font-medium">
            Account activated. You can log in now.
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-cyan-200/80 bg-white/95 shadow-xl shadow-cyan-500/10 p-6 space-y-4 backdrop-blur-sm"
        >
          {error && (
            <p className="text-base text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-base font-medium text-slate-800 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-base font-medium text-slate-800 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-slate-700 text-base mt-4">
          Business owner?{" "}
          <Link
            href="/signup"
            className="text-cyan-600 hover:text-cyan-700 font-medium text-base"
          >
            Sign up
          </Link>
          {" · "}
          <Link href="/" className="text-slate-700 hover:text-slate-900 font-medium text-base">
            Home
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link
            href="/"
            className="text-slate-700 hover:text-slate-900 text-base font-medium"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
