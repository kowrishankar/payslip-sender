"use client";

import { useState } from "react";
import type { Employee } from "./EmployeeList";

interface SendCustomEmailFormProps {
  businessId: string;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendCustomEmailForm({
  businessId,
  employee,
  onClose,
  onSuccess,
}: SendCustomEmailFormProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!employee) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/employees/${employee.id}/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      if (data.emailSent) {
        setSuccess(`Email sent to ${employee.email}`);
        setSubject("");
        setBody("");
        onSuccess();
      } else {
        setError(data.emailError ?? "Email not sent");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-cyan-200/80 bg-white shadow-xl shadow-cyan-500/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900">Send customised email</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-base text-slate-700 mb-4">To: {employee.name} &lt;{employee.email}&gt;</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-base text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium">
              {error}
            </p>
          )}
          {success && (
            <p className="text-base text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2 font-medium">
              {success}
            </p>
          )}
          <div>
            <label htmlFor="email-subject" className="block text-base font-medium text-slate-800 mb-1">
              Subject
            </label>
            <input
              id="email-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message from your employer"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <div>
            <label htmlFor="email-body" className="block text-base font-medium text-slate-800 mb-1">
              Message
            </label>
            <textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={5}
              placeholder="Type your message…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 resize-y min-h-[120px]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-base transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !body.trim()}
              className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25 transition-colors"
            >
              {loading ? "Sending…" : "Send email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
