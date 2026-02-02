"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface PayslipItem {
  id: string;
  fileName: string;
  createdAt: string;
}

interface MyProfile {
  name: string;
  email: string;
  department?: string;
  startDate?: string;
  address?: string;
  contactNumber?: string;
}

export default function MyPayslipsClient({ userName, isEmployer = false }: { userName: string; isEmployer?: boolean }) {
  const [payslips, setPayslips] = useState<PayslipItem[]>([]);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    async function fetchPayslips() {
      try {
        const res = await fetch("/api/payslips");
        const data = await res.json();
        if (res.ok) setPayslips(data);
      } finally {
        setLoading(false);
      }
    }
    fetchPayslips();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (res.ok) setProfile(data);
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, []);

  function downloadUrl(id: string) {
    return `/api/payslips/${id}/download`;
  }

  return (
    <div className="w-full py-10 text-base">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My payslips</h1>
          <p className="text-slate-700 text-base mt-1">View and download your payslips</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-slate-800 text-base font-medium">{userName}</span>
          {isEmployer && (
            <Link
              href="/dashboard"
              className="text-base font-medium text-slate-700 hover:text-cyan-600 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-50"
            >
              My businesses
            </Link>
          )}
          <Link
            href="/"
            className="text-base font-medium text-slate-700 hover:text-cyan-600 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-50"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-base font-medium text-slate-700 hover:text-rose-500 transition-colors py-2 px-3 rounded-xl hover:bg-rose-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">My information</h2>
        {profileLoading ? (
          <div className="text-slate-700 text-base font-medium py-4">Loading…</div>
        ) : profile ? (
          <div className="rounded-2xl border border-cyan-200/80 bg-white shadow-card shadow-cyan-500/10 p-6 space-y-2 text-base">
            <p><span className="text-slate-600">Name:</span> <span className="text-slate-900 font-medium">{profile.name}</span></p>
            <p><span className="text-slate-600">Email:</span> <span className="text-slate-900">{profile.email}</span></p>
            {profile.department && <p><span className="text-slate-600">Department:</span> <span className="text-slate-900">{profile.department}</span></p>}
            {profile.startDate && <p><span className="text-slate-600">Start date:</span> <span className="text-slate-900">{profile.startDate}</span></p>}
            {profile.contactNumber && <p><span className="text-slate-600">Contact:</span> <span className="text-slate-900">{profile.contactNumber}</span></p>}
            {profile.address && <p><span className="text-slate-600">Address:</span> <span className="text-slate-900">{profile.address}</span></p>}
          </div>
        ) : (
          <div className="text-slate-700 text-base font-medium">Could not load your information.</div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">My payslips</h2>
      {loading ? (
        <div className="text-slate-700 text-base font-medium py-12 text-center">Loading payslips…</div>
      ) : payslips.length === 0 ? (
        <div className="rounded-2xl border border-cyan-200/80 bg-white p-8 text-center text-slate-700 text-base shadow-card shadow-cyan-500/10">
          <p className="font-medium">No payslips yet.</p>
          <p className="mt-2">When your employer sends you a payslip, it will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {payslips.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 py-4 px-5 rounded-xl border border-cyan-200/80 bg-white hover:bg-cyan-50/50 hover:border-cyan-300 transition-all shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 text-base truncate">{p.fileName}</p>
                <p className="text-base text-slate-600 mt-0.5">
                  {new Date(p.createdAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
              <a
                href={downloadUrl(p.id)}
                download={p.fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-base font-medium text-cyan-600 hover:text-cyan-700 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-50"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
      </section>
    </div>
  );
}
