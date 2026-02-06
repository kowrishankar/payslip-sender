"use client";

import { useEffect, useState, useCallback } from "react";
import { IconCalendar, IconPlus, IconPencil, IconTrash, IconX, IconCheck } from "@/components/Icons";
import type { Employee } from "@/components/EmployeeList";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Display order: Monday first (1), then Tue..Sun (2..6, 0)
const DISPLAY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export interface RotaShift {
  id: string;
  businessId: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface WeeklyRotaProps {
  businessId: string;
  readOnly?: boolean;
  refreshTrigger?: number;
}

export default function WeeklyRota({
  businessId,
  readOnly = false,
  refreshTrigger = 0,
}: WeeklyRotaProps) {
  const [shifts, setShifts] = useState<RotaShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchRota = useCallback(async () => {
    try {
      const [rotaRes, empRes] = await Promise.all([
        fetch(`/api/businesses/${businessId}/rota`),
        readOnly ? Promise.resolve(null) : fetch(`/api/businesses/${businessId}/employees`),
      ]);
      const rotaData = await rotaRes.json();
      if (rotaRes.ok) setShifts(rotaData);
      if (!readOnly && empRes?.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }
    } finally {
      setLoading(false);
    }
  }, [businessId, readOnly]);

  useEffect(() => {
    setLoading(true);
    fetchRota();
  }, [fetchRota, refreshTrigger]);

  async function handleAdd(dayOfWeek: number, employeeId: string, startTime: string, endTime: string) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/rota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayOfWeek, employeeId, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add shift");
      setShifts((prev) => [...prev, data]);
      setAddingDay(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add shift");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(
    shiftId: string,
    payload: { employeeId?: string; dayOfWeek?: number; startTime?: string; endTime?: string }
  ) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/rota/${shiftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update shift");
      setShifts((prev) => prev.map((s) => (s.id === shiftId ? data : s)));
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update shift");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(shiftId: string) {
    if (!confirm("Remove this shift from the rota?")) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/rota/${shiftId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete shift");
      }
      setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete shift");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-600 text-lg font-medium">
        Loading rota…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-card">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-xl font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <IconCalendar className="w-5 h-5 text-cyan-500" />
          Weekly rota
        </h3>
        {!readOnly && (
          <p className="text-slate-600 text-base">
            Add shifts per day. Employees can view this rota in their portal.
          </p>
        )}
      </div>
      {error && (
        <div className="mx-6 mt-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-base">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[700px]">
          {DISPLAY_DAY_ORDER.map((dayOfWeek) => {
            const dayShifts = shifts.filter((s) => s.dayOfWeek === dayOfWeek);
            return (
              <div
                key={dayOfWeek}
                className="border-r border-slate-200 last:border-r-0 p-4 min-h-[200px] flex flex-col"
              >
                <div className="font-semibold text-slate-800 text-base mb-3 uppercase tracking-wide">
                  {DAY_NAMES[dayOfWeek]}
                </div>
                <div className="space-y-2 flex-1">
                  {dayShifts.map((shift) =>
                    editingId === shift.id ? (
                      <EditShiftForm
                        key={shift.id}
                        shift={shift}
                        employees={employees}
                        onSave={(payload) => handleUpdate(shift.id, payload)}
                        onCancel={() => setEditingId(null)}
                        saving={saving}
                      />
                    ) : (
                      <div
                        key={shift.id}
                        className="rounded-lg border border-cyan-200/80 bg-cyan-50/50 px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-slate-900 truncate">{shift.employeeName ?? "—"}</p>
                        <p className="text-slate-700 text-sm mt-0.5">
                          {shift.startTime} – {shift.endTime}
                        </p>
                        {!readOnly && (
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(shift.id)}
                              disabled={saving}
                              className="text-slate-600 hover:text-cyan-600 p-1 rounded disabled:opacity-50"
                              title="Edit shift"
                            >
                              <IconPencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(shift.id)}
                              disabled={saving}
                              className="text-slate-600 hover:text-red-600 p-1 rounded disabled:opacity-50"
                              title="Remove shift"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {addingDay === dayOfWeek ? (
                    <AddShiftForm
                      dayOfWeek={dayOfWeek}
                      employees={employees}
                      onAdd={(employeeId, startTime, endTime) =>
                        handleAdd(dayOfWeek, employeeId, startTime, endTime)
                      }
                      onCancel={() => setAddingDay(null)}
                      saving={saving}
                    />
                  ) : !readOnly ? (
                    <button
                      type="button"
                      onClick={() => setAddingDay(dayOfWeek)}
                      className="w-full rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50/50 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <IconPlus className="w-4 h-4" />
                      Add shift
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddShiftForm({
  dayOfWeek,
  employees,
  onAdd,
  onCancel,
  saving,
}: {
  dayOfWeek: number;
  employees: Employee[];
  onAdd: (employeeId: string, startTime: string, endTime: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId.trim()) return;
    onAdd(employeeId, startTime, endTime);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-cyan-200 bg-white p-3 space-y-2">
      <select
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        required
        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
      >
        <option value="">Select employee</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5"
        />
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
        >
          <IconX className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !employeeId}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 disabled:opacity-50"
        >
          <IconCheck className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </form>
  );
}

function EditShiftForm({
  shift,
  employees,
  onSave,
  onCancel,
  saving,
}: {
  shift: RotaShift;
  employees: Employee[];
  onSave: (payload: { employeeId?: string; dayOfWeek?: number; startTime?: string; endTime?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [employeeId, setEmployeeId] = useState(shift.employeeId);
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ employeeId, startTime, endTime });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-cyan-200 bg-white p-3 space-y-2">
      <select
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        required
        className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
      >
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5"
        />
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
        >
          <IconX className="w-3.5 h-3.5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-600 disabled:opacity-50"
        >
          <IconCheck className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </form>
  );
}
