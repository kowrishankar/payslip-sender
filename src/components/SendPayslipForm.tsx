"use client";

import { useRef, useState } from "react";
import type { Employee } from "./EmployeeList";

interface SendPayslipFormProps {
  businessId?: string;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SendPayslipForm({
  businessId,
  employee,
  onClose,
  onSuccess,
}: SendPayslipFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  if (!employee) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a payslip file (PDF recommended).");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const formData = new FormData();
      if (businessId) formData.set("businessId", businessId);
      formData.set("employeeId", employee.id);
      formData.set("payslip", file);
      if (message.trim()) formData.set("message", message.trim());
      if (amount.trim() && !Number.isNaN(parseFloat(amount)))
        formData.set("amount", amount.trim());
      const res = await fetch("/api/payslips", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      if (data.emailSent) {
        setSuccess(`Payslip saved and notification email sent to ${employee.email}.`);
      } else {
        setSuccess(
          `Payslip saved. Email not sent: ${data.emailError ?? "Unknown error"}. Check .env SMTP settings.`
        );
      }
      setFile(null);
      setMessage("");
      setAmount("");
      if (inputRef.current) inputRef.current.value = "";
      onSuccess();
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
          <h3 className="text-xl font-semibold text-slate-900">
            Send payslip to {employee.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-base text-slate-700 mb-4">{employee.email}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email-message"
              className="block text-base font-medium text-slate-800 mb-1"
            >
              Message to include in email (optional)
            </label>
            <textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="e.g. Thank you for your work this month. Please find your payslip attached."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 resize-y min-h-[80px]"
            />
          </div>
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
            <label
              htmlFor="payslip-amount"
              className="block text-base font-medium text-slate-800 mb-1"
            >
              Payment amount (optional, for dashboard totals)
            </label>
            <input
              id="payslip-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 1500.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <div>
            <label
              htmlFor="payslip-file"
              className="block text-base font-medium text-slate-800 mb-1"
            >
              Payslip file (PDF)
            </label>
            <input
              id="payslip-file"
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-base text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:text-white file:font-medium file:cursor-pointer hover:file:bg-cyan-600"
            />
            {file && (
              <p className="text-base text-slate-600 mt-1">{file.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors font-medium text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25"
            >
              {loading ? "Sending…" : "Send payslip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
