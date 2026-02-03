"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconCheck, IconHome } from "@/components/Icons";

function InviteAcceptForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  useEffect(() => {
    setToken(searchParams.get("token") ?? "");
  }, [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const t = token.trim();
    if (!t) {
      setError("Please enter the token from your invite email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Activation failed");
      }
      setSuccess(true);
      setTimeout(() => router.push("/login?activated=1"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 text-slate-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-cyan-200/80 bg-white/95 shadow-xl shadow-cyan-500/10 p-6 text-center backdrop-blur-sm">
          <p className="text-cyan-700 font-semibold text-lg mb-2">Account activated successfully.</p>
          <p className="text-slate-700 text-lg">Redirecting you to log in…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 text-slate-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-2 uppercase tracking-wide">
          Activate your account
        </h1>
        <p className="text-slate-700 text-lg text-center mb-6">
          You were invited by your employer. Set a password to activate your account and log in.
        </p>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-cyan-200/80 bg-white/95 shadow-xl shadow-cyan-500/10 p-6 space-y-4 backdrop-blur-sm"
        >
          {error && (
            <p className="text-lg text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="token"
              className="block text-lg font-medium text-slate-800 mb-1"
            >
              Invite token
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="Paste the token from your invite email (or use the link from the email)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
            <p className="text-slate-600 text-lg mt-1">
              If you opened this page from the link in your email, the token may already be filled in.
            </p>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-lg font-medium text-slate-800 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-lg font-medium text-slate-800 mb-1"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Same as above"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2.5 px-4 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25 uppercase tracking-wide inline-flex items-center justify-center gap-2"
          >
            <IconCheck className="w-5 h-5" />
            {loading ? "Activating…" : "Activate account"}
          </button>
        </form>
        <p className="text-center text-slate-700 text-lg mt-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-medium uppercase tracking-wide">
            <IconHome className="w-4 h-4" />
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 flex items-center justify-center">
        <p className="text-slate-700 text-lg font-medium">Loading…</p>
      </main>
    }>
      <InviteAcceptForm />
    </Suspense>
  );
}
