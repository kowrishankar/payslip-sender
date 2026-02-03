"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconUserPlus, IconLogin, IconHome } from "@/components/Icons";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail
          ? `${data.error}: ${data.detail}`
          : data.error ?? "Sign up failed";
        throw new Error(msg);
      }
      router.push("/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 text-slate-800 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 text-center mb-2 uppercase tracking-wide">
          Sign up as business owner
        </h1>
        <p className="text-slate-700 text-lg text-center mb-6">
          Create an account to manage your businesses, staff, and send payslips. Employees do not sign up here—they use the link in their invite email.
        </p>
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-cyan-200/80 bg-white/95 shadow-xl shadow-cyan-500/10 p-6 space-y-4 backdrop-blur-sm"
        >
          {error && (
            <p className="text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-slate-800 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="Your name"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-lg font-medium text-slate-800 mb-1"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="you@company.com"
            />
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-lg py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25 uppercase tracking-wide inline-flex items-center justify-center gap-2"
          >
            <IconUserPlus className="w-5 h-5" />
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="text-center text-slate-700 text-lg mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 font-medium text-lg uppercase tracking-wide"
          >
            <IconLogin className="w-4 h-4" />
            Log in
          </Link>
        </p>
        <p className="text-center mt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 text-lg font-medium uppercase tracking-wide"
          >
            <IconHome className="w-4 h-4" />
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
