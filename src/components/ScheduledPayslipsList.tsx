"use client";

import { useState, useEffect } from "react";
import { IconPencil, IconPaperAirplane, IconTrash, IconCheck, IconX } from "@/components/Icons";

export interface ScheduledPayslipItem {
  id: string;
  fileName: string;
  emailMessage?: string;
  amountCents?: number;
  scheduledAt: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
}

const sectionTitleClass = "text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200 uppercase tracking-wide";

interface ScheduledPayslipsListProps {
  businessId: string;
  refreshTrigger?: number;
}

export default function ScheduledPayslipsList({
  businessId,
  refreshTrigger = 0,
}: ScheduledPayslipsListProps) {
  const [items, setItems] = useState<ScheduledPayslipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScheduledAt, setEditScheduledAt] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [error, setError] = useState("");

  async function fetchScheduled() {
    if (!businessId) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/scheduled-payslips`);
      const data = await res.json();
      if (res.ok) setItems(Array.isArray(data) ? data : []);
      else setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScheduled();
  }, [businessId, refreshTrigger]);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this scheduled payslip? It will be removed and not sent.")) return;
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/businesses/${businessId}/scheduled-payslips/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to cancel");
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendNow(id: string) {
    if (!confirm("Send this payslip now? It will be delivered immediately and removed from the schedule.")) return;
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/businesses/${businessId}/scheduled-payslips/${id}/send-now`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  function startEdit(item: ScheduledPayslipItem) {
    setEditingId(item.id);
    const d = new Date(item.scheduledAt);
    setEditScheduledAt(d.toISOString().slice(0, 16));
    setEditMessage(item.emailMessage ?? "");
    setError("");
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const d = new Date(editScheduledAt);
    if (Number.isNaN(d.getTime()) || d <= new Date()) {
      setError("Choose a future date and time.");
      return;
    }
    setActionLoading(editingId);
    setError("");
    try {
      const res = await fetch(`/api/businesses/${businessId}/scheduled-payslips/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: d.toISOString(),
          emailMessage: editMessage.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingId
            ? { ...i, scheduledAt: d.toISOString(), emailMessage: editMessage.trim() || undefined }
            : i
        )
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <h3 className={sectionTitleClass}>Scheduled payslips</h3>
        <p className="text-lg text-slate-600">Loading scheduled jobs…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
      <h3 className={sectionTitleClass}>Scheduled payslips</h3>
      <p className="text-lg text-slate-700 mb-4">
        Future payslips scheduled to be sent automatically. You can edit the time, send now, or cancel.
      </p>

      {error && (
        <p className="text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium mb-4">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-lg text-slate-600 py-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          No scheduled payslips. Use &quot;Bulk send &amp; schedule payslips&quot; to schedule.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-lg border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left font-semibold text-slate-800 px-4 py-3 uppercase tracking-wide">Employee</th>
                <th className="text-left font-semibold text-slate-800 px-4 py-3 uppercase tracking-wide">File</th>
                <th className="text-left font-semibold text-slate-800 px-4 py-3 uppercase tracking-wide">Scheduled for</th>
                <th className="text-right font-semibold text-slate-800 px-4 py-3 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-cyan-50/30">
                  <td className="px-4 py-3 text-slate-900">
                    <span className="font-medium">{item.employeeName}</span>
                    <span className="text-slate-600 block text-base">{item.employeeEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 truncate max-w-[180px]" title={item.fileName}>
                    {item.fileName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <input
                          type="datetime-local"
                          value={editScheduledAt}
                          onChange={(e) => setEditScheduledAt(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full max-w-[220px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-lg focus:ring-2 focus:ring-cyan-400"
                        />
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          placeholder="Optional message"
                          rows={2}
                          className="w-full max-w-[220px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-base focus:ring-2 focus:ring-cyan-400 resize-y"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={actionLoading === item.id}
                            className="inline-flex items-center gap-1.5 text-base font-medium text-cyan-600 uppercase tracking-wide hover:text-cyan-700 disabled:opacity-50"
                          >
                            <IconCheck className="w-4 h-4" />
                            {actionLoading === item.id ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1.5 text-base font-medium text-slate-600 uppercase tracking-wide hover:text-slate-800"
                          >
                            <IconX className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      new Date(item.scheduledAt).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === item.id ? null : (
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1.5 text-base font-medium text-slate-700 uppercase tracking-wide hover:text-slate-900 py-1.5 px-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                        >
                          <IconPencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendNow(item.id)}
                          disabled={actionLoading !== null}
                          className="inline-flex items-center gap-1.5 text-base font-medium text-cyan-600 uppercase tracking-wide hover:text-cyan-700 py-1.5 px-2 rounded-lg hover:bg-cyan-50 disabled:opacity-50"
                        >
                          <IconPaperAirplane className="w-4 h-4" />
                          {actionLoading === item.id ? "Sending…" : "Send now"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(item.id)}
                          disabled={actionLoading !== null}
                          className="inline-flex items-center gap-1.5 text-base font-medium text-red-600 uppercase tracking-wide hover:text-red-700 py-1.5 px-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Remove from schedule (payslip will not be sent)"
                        >
                          <IconTrash className="w-4 h-4" />
                          {actionLoading === item.id ? "…" : "Cancel schedule"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
