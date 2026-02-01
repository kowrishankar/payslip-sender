"use client";

import { useState, useEffect } from "react";

interface PayReminderProps {
  businessId: string;
  payCycle?: string;
  payDayOfWeek?: number;
  payDayOfMonth?: number;
  onUpdate: () => void;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getNextPayDate(
  payCycle: string,
  payDayOfWeek: number | undefined,
  payDayOfMonth: number | undefined
): Date | null {
  const now = new Date();
  if (payCycle === "weekly" && payDayOfWeek !== undefined) {
    const d = new Date(now);
    const currentDay = d.getDay();
    let daysUntil = payDayOfWeek - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    d.setDate(d.getDate() + daysUntil);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (payCycle === "monthly" && payDayOfMonth !== undefined) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(payDayOfMonth, lastDay);
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    if (d <= now) {
      const nextMonth = month + 1;
      const nextLastDay = new Date(year, nextMonth + 1, 0).getDate();
      d.setMonth(nextMonth);
      d.setDate(Math.min(payDayOfMonth, nextLastDay));
    }
    return d;
  }
  return null;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export default function PayReminder({
  businessId,
  payCycle,
  payDayOfWeek,
  payDayOfMonth,
  onUpdate,
}: PayReminderProps) {
  const [editing, setEditing] = useState(false);
  const [cycle, setCycle] = useState(payCycle ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(payDayOfWeek ?? 0);
  const [dayOfMonth, setDayOfMonth] = useState(payDayOfMonth ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCycle(payCycle ?? "");
    setDayOfWeek(payDayOfWeek ?? 0);
    setDayOfMonth(payDayOfMonth ?? 1);
  }, [payCycle, payDayOfWeek, payDayOfMonth]);

  const nextPay = getNextPayDate(
    cycle || "monthly",
    cycle === "weekly" ? dayOfWeek : undefined,
    cycle === "monthly" ? dayOfMonth : undefined
  );
  const daysLeft = nextPay ? daysUntil(nextPay) : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payCycle: cycle || null,
          payDayOfWeek: cycle === "weekly" ? dayOfWeek : null,
          payDayOfMonth: cycle === "monthly" ? dayOfMonth : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-2xl border border-cyan-200/80 bg-white p-6 shadow-card">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Pay date reminder</h3>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-base text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium">{error}</p>}
          <div>
            <label className="block text-base font-medium text-slate-800 mb-2">Pay cycle</label>
            <select
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="">Not set</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {cycle === "weekly" && (
            <div>
              <label className="block text-base font-medium text-slate-800 mb-2">Pay day (week)</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
          )}
          {cycle === "monthly" && (
            <div>
              <label className="block text-base font-medium text-slate-800 mb-2">Pay day (month, 1–31)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base disabled:opacity-50 shadow-md shadow-cyan-500/25"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-200/80 bg-white p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 mb-1">Pay date reminder</h3>
          {cycle ? (
            <>
              <p className="text-slate-700 text-base mt-1">
                {cycle === "weekly"
                  ? `Pay day: ${DAY_NAMES[dayOfWeek]}`
                  : `Pay day: ${dayOfMonth}${dayOfMonth === 1 ? "st" : dayOfMonth === 2 ? "nd" : dayOfMonth === 3 ? "rd" : "th"} of each month`}
              </p>
              {daysLeft !== null && (
                <p className="text-cyan-600 font-semibold text-base mt-2">
                  {daysLeft === 0
                    ? "Pay day is today"
                    : daysLeft === 1
                    ? "1 day left until pay day"
                    : `${daysLeft} days left until pay day`}
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-700 text-base mt-1">Set pay cycle to see days until next pay day</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-base font-medium text-cyan-600 hover:text-cyan-700 shrink-0"
        >
          {cycle ? "Edit" : "Set reminder"}
        </button>
      </div>
    </div>
  );
}
