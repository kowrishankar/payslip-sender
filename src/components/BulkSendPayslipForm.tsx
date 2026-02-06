"use client";

import { useRef, useState, useEffect } from "react";
import { IconX, IconPaperAirplane } from "@/components/Icons";
import type { Employee } from "./EmployeeList";

interface BulkSendPayslipFormProps {
  businessId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkSendPayslipForm({
  businessId,
  onClose,
  onSuccess,
}: BulkSendPayslipFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [scheduleFor, setScheduleFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingEmployees(true);
    fetch(`/api/businesses/${businessId}/employees`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setEmployees(data);
      })
      .finally(() => setLoadingEmployees(false));
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    setAssignments({});
    setMessages({});
    setAmounts({});
  }

  function setAssignment(index: number, employeeId: string) {
    setAssignments((prev) => ({ ...prev, [index]: employeeId }));
  }

  function setMessage(index: number, value: string) {
    setMessages((prev) => ({ ...prev, [index]: value }));
  }

  function setAmount(index: number, value: string) {
    setAmounts((prev) => ({ ...prev, [index]: value }));
  }

  async function handleSubmit(sendNow: boolean) {
    if (files.length === 0) {
      setError("Select at least one PDF file.");
      return;
    }
    const missing = files.map((_, i) => assignments[i]).filter((id) => !id).length;
    if (missing > 0) {
      setError("Assign an employee to each file.");
      return;
    }

    const scheduleValue = sendNow ? null : scheduleFor.trim();
    let scheduleDate: Date | null = null;
    if (scheduleValue) {
      scheduleDate = new Date(scheduleValue);
      if (Number.isNaN(scheduleDate.getTime())) {
        setError("Invalid schedule date/time.");
        return;
      }
      if (scheduleDate <= new Date()) {
        setError("Schedule time must be in the future.");
        return;
      }
    } else if (!sendNow) {
      setError("Set a date and time to schedule, or use Send now.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("businessId", businessId);
      if (scheduleDate) formData.set("scheduleFor", scheduleDate.toISOString());

      const sharedMessage = (messages[0] ?? "").trim();
      files.forEach((file, i) => {
        formData.set(`payslip_${i}`, file);
        formData.set(`employeeId_${i}`, assignments[i]!);
        if (sharedMessage) formData.set(`message_${i}`, sharedMessage);
        const amt = amounts[i]?.trim();
        if (amt && !Number.isNaN(parseFloat(amt))) formData.set(`amount_${i}`, amt);
      });

      const res = await fetch("/api/payslips/bulk", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Bulk send failed");

      setSuccess(data.message ?? (scheduleDate ? "Payslips scheduled." : "Payslips sent."));
      onSuccess();
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-cyan-200/80 bg-white shadow-xl shadow-cyan-500/10 p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900 uppercase tracking-wide">
            Bulk send &amp; schedule payslips
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

        <p className="text-lg text-slate-700 mb-4">
          Upload multiple PDFs and assign each to an employee. Send now or schedule for later.
        </p>

        <div className="mb-4">
          <label className="block text-lg font-medium text-slate-800 mb-1">
            Payslip files (PDF)
          </label>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFilesChange}
            className="w-full text-lg text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-500 file:text-white file:font-medium file:cursor-pointer hover:file:bg-cyan-600"
          />
          {files.length > 0 && (
            <p className="text-lg text-slate-600 mt-1">{files.length} file(s) selected</p>
          )}
        </div>

        {loadingEmployees && (
          <p className="text-lg text-slate-600 mb-4">Loading employees…</p>
        )}

        {files.length > 0 && !loadingEmployees && (
          <>
            <div className="mb-4">
              <label className="block text-lg font-medium text-slate-800 mb-1">
                Schedule send for (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduleFor}
                onChange={(e) => setScheduleFor(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              />
              <p className="text-base text-slate-500 mt-1">
                Leave empty to send immediately. Set a future time to schedule all payslips.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 max-h-64 overflow-y-auto">
              <table className="w-full text-left text-base">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium text-slate-800 uppercase tracking-wide">File</th>
                    <th className="px-3 py-2 font-medium text-slate-800 uppercase tracking-wide">Employee</th>
                    <th className="px-3 py-2 font-medium text-slate-800 w-24 uppercase tracking-wide">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2 text-slate-700 truncate max-w-[140px]" title={file.name}>
                        {file.name}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={assignments[i] ?? ""}
                          onChange={(e) => setAssignment(i, e.target.value)}
                          disabled={loadingEmployees}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-lg focus:ring-2 focus:ring-cyan-400 disabled:opacity-60"
                        >
                          <option value="">Select employee</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.email})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={amounts[i] ?? ""}
                          onChange={(e) => setAmount(i, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-900 text-lg"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {files.length > 0 && (
              <div className="mb-4">
                <span className="block text-lg font-medium text-slate-800 mb-1">
                  Message (optional, same for all payslips)
                </span>
                <textarea
                  value={messages[0] ?? ""}
                  onChange={(e) => setMessage(0, e.target.value)}
                  rows={2}
                  placeholder="e.g. Thank you for your work this month."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-lg placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 resize-y"
                />
              </div>
            )}
          </>
        )}

        {error && (
          <p className="text-lg text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium mb-4">
            {error}
          </p>
        )}
        {success && (
          <p className="text-lg text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2 font-medium mb-4">
            {success}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-lg tracking-wide"
          >
            <IconX className="w-4 h-4" />
            Cancel
          </button>
          {scheduleFor.trim() && new Date(scheduleFor) > new Date() ? (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium text-lg tracking-wide shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconPaperAirplane className="w-4 h-4" />
              {loading ? "Scheduling…" : "Schedule"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-lg tracking-wide shadow-md shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconPaperAirplane className="w-4 h-4" />
            {loading ? "Sending…" : "Send Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
