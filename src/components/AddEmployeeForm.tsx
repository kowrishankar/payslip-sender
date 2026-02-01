"use client";

import { useState } from "react";

interface AddEmployeeFormProps {
  businessId?: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function AddEmployeeForm({ businessId, onSuccess, onClose }: AddEmployeeFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [payCycle, setPayCycle] = useState<"weekly" | "monthly" | "">("");
  const [payDayOfWeek, setPayDayOfWeek] = useState<number>(1);
  const [payDayOfMonth, setPayDayOfMonth] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!businessId) {
        setError("Business context is required. Open a business first.");
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/businesses/${businessId}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
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
      if (!res.ok) throw new Error(data.error || "Failed to add employee");
      setName("");
      setEmail("");
      setDepartment("");
      setStartDate("");
      setAddress("");
      setContactNumber("");
      setPayCycle("");
      setPayDayOfWeek(1);
      setPayDayOfMonth(1);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
          placeholder="e.g. Jane Smith"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
          placeholder="jane@company.com"
        />
      </div>
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">
          Department (optional)
        </label>
        <input
          id="department"
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
          placeholder="e.g. Engineering"
        />
      </div>
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">
          Start date (optional)
        </label>
        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
          Address (optional)
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
          placeholder="e.g. 123 Main St, City"
        />
      </div>
      <div>
        <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-700 mb-1">
          Contact number (optional)
        </label>
        <input
          id="contactNumber"
          type="tel"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
          placeholder="e.g. +1 234 567 8900"
        />
      </div>
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm font-medium text-slate-300 mb-3">How are they paid? (optional)</p>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="addPayCycle"
              checked={payCycle === "weekly"}
              onChange={() => setPayCycle("weekly")}
              className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-slate-700">Weekly</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="addPayCycle"
              checked={payCycle === "monthly"}
              onChange={() => setPayCycle("monthly")}
              className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-slate-700">Monthly</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="addPayCycle"
              checked={payCycle === ""}
              onChange={() => setPayCycle("")}
              className="rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-slate-700">Not set</span>
          </label>
        </div>
        {payCycle === "weekly" && (
          <div className="mb-3">
            <label htmlFor="add-payDayOfWeek" className="block text-sm text-slate-600 mb-1">Pay day (week)</label>
            <select
              id="add-payDayOfWeek"
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
            <label htmlFor="add-payDayOfMonth" className="block text-sm text-slate-600 mb-1">Pay day (month, 1–31)</label>
            <input
              id="add-payDayOfMonth"
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
      <div className={`flex gap-3 ${onClose ? "" : ""}`}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`${onClose ? "flex-1" : "w-full"} bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/25`}
        >
          {loading ? "Adding…" : "Add employee"}
        </button>
      </div>
    </form>
  );
}
