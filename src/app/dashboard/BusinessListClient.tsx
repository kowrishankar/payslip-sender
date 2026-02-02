"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Business {
  id: string;
  name: string;
  logoUrl?: string;
  logoPath?: string;
  payCycle?: string;
  payDayOfWeek?: number;
  payDayOfMonth?: number;
  createdAt: string;
}

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

interface BusinessListClientProps {
  userName: string;
  isEmployee?: boolean;
}

export default function BusinessListClient({ userName, isEmployee = false }: BusinessListClientProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const res = await fetch("/api/businesses");
        const data = await res.json();
        if (res.ok) setBusinesses(data);
      } finally {
        setLoading(false);
      }
    }
    fetchBusinesses();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setAdding(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create business");
      setBusinesses((prev) => [data, ...prev]);
      setNewName("");
      setShowAdd(false);
      router.push(`/dashboard/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="w-full py-10 text-base">
      <header className="flex flex-wrap items-center justify-between gap-5 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your businesses</h1>
          <p className="text-slate-700 text-base mt-1">Select a business to manage staff and payslips</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-slate-700 text-base font-medium">{userName}</span>
          {isEmployee && (
            <Link href="/my-payslips" className="text-base text-slate-600 hover:text-cyan-600 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-50 font-medium">
              My payslips
            </Link>
          )}
          <Link href="/" className="text-base text-slate-600 hover:text-cyan-600 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-50 font-medium">
            Home
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-base text-slate-600 hover:text-rose-500 transition-colors py-2 px-3 rounded-xl hover:bg-rose-50 font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      {showAdd ? (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl border border-cyan-200/80 bg-white shadow-xl shadow-cyan-500/10 p-6 mb-6 text-base"
        >
          {error && (
            <p className="text-base text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
          )}
          <label htmlFor="business-name" className="block text-base font-medium text-slate-700 mb-2">
            Business name
          </label>
          <input
            id="business-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            placeholder="e.g. Acme Ltd"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base mb-4 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowAdd(false); setError(""); }}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base disabled:opacity-50 min-h-[3rem] shadow-md shadow-cyan-500/25"
            >
              {adding ? "Creating…" : "Create business"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="mb-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base transition-colors min-h-[3rem] shadow-md shadow-cyan-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5-10v-4a1 1 0 011-1h4a1 1 0 011 1v4M9 7h6" />
          </svg>
          Add business
        </button>
      )}

      {loading ? (
        <div className="text-slate-500 py-10 text-center text-base">Loading…</div>
      ) : businesses.length === 0 ? (
        <div className="rounded-2xl border border-cyan-200/80 bg-white p-10 text-center text-slate-500 text-base shadow-lg shadow-cyan-500/5">
          No businesses yet. Add your first business above.
        </div>
      ) : (
        <ul className="space-y-4">
          {businesses.map((b) => {
            const logoSrc = b.logoPath
              ? `/api/businesses/${b.id}/logo`
              : b.logoUrl || null;
            return (
              <li key={b.id}>
                <Link
                  href={`/dashboard/${b.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-cyan-200/80 bg-white p-5 hover:border-cyan-300 hover:bg-cyan-50/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-base"
                >
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xl font-semibold">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 text-lg">{b.name}</p>
                    {b.payCycle && (
                      <p className="text-base text-slate-600 mt-0.5">
                        Pay: {b.payCycle === "weekly" ? `Weekly (day ${b.payDayOfWeek})` : `Monthly (day ${b.payDayOfMonth})`}
                      </p>
                    )}
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-slate-400 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
