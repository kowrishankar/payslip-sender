"use client";

import { useState, useEffect } from "react";
import type { Employee } from "./EmployeeList";

interface EditEmployeeFormProps {
  businessId?: string;
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditEmployeeForm({
  businessId,
  employee,
  onClose,
  onSuccess,
}: EditEmployeeFormProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [payCycle, setPayCycle] = useState<"weekly" | "monthly" | "">("");
  const [payDayOfWeek, setPayDayOfWeek] = useState<number>(1);
  const [payDayOfMonth, setPayDayOfMonth] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setDepartment(employee.department ?? "");
      setStartDate(employee.startDate ?? "");
      setAddress(employee.address ?? "");
      setContactNumber(employee.contactNumber ?? "");
      setPayCycle((employee.payCycle as "weekly" | "monthly") || "");
      setPayDayOfWeek(employee.payDayOfWeek ?? 1);
      setPayDayOfMonth(employee.payDayOfMonth ?? 1);
    }
  }, [employee]);

  if (!employee) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!businessId) {
        setError("Business context is required.");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/businesses/${businessId}/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          department: department || undefined,
          startDate: startDate || undefined,
          address: address || undefined,
          contactNumber: contactNumber || undefined,
          payCycle: payCycle || undefined,
          payDayOfWeek: payCycle === "weekly" ? payDayOfWeek : undefined,
          payDayOfMonth: payCycle === "monthly" ? payDayOfMonth : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      onSuccess();
      onClose();
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
          <h3 className="text-lg font-semibold text-slate-800">
            Edit employee
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-slate-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">{employee.email}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <div>
            <label
              htmlFor="edit-department"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Department
            </label>
            <input
              id="edit-department"
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="e.g. Engineering"
            />
          </div>
          <div>
            <label
              htmlFor="edit-startDate"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Start date
            </label>
            <input
              id="edit-startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <div>
            <label
              htmlFor="edit-address"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Address
            </label>
            <input
              id="edit-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="e.g. 123 Main St"
            />
          </div>
          <div>
            <label
              htmlFor="edit-contactNumber"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Contact number
            </label>
            <input
              id="edit-contactNumber"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              placeholder="e.g. +1 234 567 8900"
            />
          </div>
          <div className="border-t border-slate-200 pt-4 mt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">How are they paid?</p>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payCycle"
                  checked={payCycle === "weekly"}
                  onChange={() => setPayCycle("weekly")}
                  className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-slate-700">Weekly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payCycle"
                  checked={payCycle === "monthly"}
                  onChange={() => setPayCycle("monthly")}
                  className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-slate-700">Monthly</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="payCycle"
                  checked={payCycle === ""}
                  onChange={() => setPayCycle("")}
                  className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-slate-700">Not set</span>
              </label>
            </div>
            {payCycle === "weekly" && (
              <div>
                <label htmlFor="edit-payDayOfWeek" className="block text-sm text-slate-600 mb-1">Pay day (week)</label>
                <select
                  id="edit-payDayOfWeek"
                  value={payDayOfWeek}
                  onChange={(e) => setPayDayOfWeek(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day, i) => (
                    <option key={day} value={i}>{day}</option>
                  ))}
                </select>
              </div>
            )}
            {payCycle === "monthly" && (
              <div>
                <label htmlFor="edit-payDayOfMonth" className="block text-sm text-slate-600 mb-1">Pay day (month, 1–31)</label>
                <input
                  id="edit-payDayOfMonth"
                  type="number"
                  min={1}
                  max={31}
                  value={payDayOfMonth}
                  onChange={(e) => setPayDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
