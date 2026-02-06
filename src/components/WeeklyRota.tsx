"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IconCalendar,
  IconPlus,
  IconPencil,
  IconTrash,
  IconX,
  IconCheck,
  IconList,
} from "@/components/Icons";
import type { Employee } from "@/components/EmployeeList";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DISPLAY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export interface RotaShift {
  id: string;
  businessId: string;
  employeeId: string;
  employeeName?: string;
  employeeEmail?: string;
  weekStartDate: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface WeekInfo {
  weekStartDate: string;
  label: string;
  isEditable: boolean;
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
  const [adding, setAdding] = useState<{ weekStart: string; dayOfWeek: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreviousModal, setShowPreviousModal] = useState(false);

  const today = new Date();
  const thisMonday = getMonday(today);
  const prevMonday = addDays(thisMonday, -7);
  const nextMonday1 = addDays(thisMonday, 7);
  const nextMonday2 = addDays(thisMonday, 14);

  const weeks: WeekInfo[] = [
    { weekStartDate: prevMonday, label: "Previous week", isEditable: false },
    { weekStartDate: thisMonday, label: "This week", isEditable: true },
    { weekStartDate: nextMonday1, label: "Next week", isEditable: true },
    { weekStartDate: nextMonday2, label: "In 2 weeks", isEditable: true },
  ];

  const fetchRota = useCallback(async () => {
    try {
      const from = prevMonday;
      const to = nextMonday2;
      const [rotaRes, empRes] = await Promise.all([
        fetch(`/api/businesses/${businessId}/rota?from=${from}&to=${to}`),
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
  }, [businessId, readOnly, prevMonday, nextMonday2]);

  useEffect(() => {
    setLoading(true);
    fetchRota();
  }, [fetchRota, refreshTrigger]);

  async function handleAdd(
    weekStartDate: string,
    dayOfWeek: number,
    employeeId: string,
    startTime: string,
    endTime: string
  ) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/rota`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDate, dayOfWeek, employeeId, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add shift");
      setShifts((prev) => [...prev, data]);
      setAdding(null);
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
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-xl font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <IconCalendar className="w-5 h-5 text-cyan-500" />
          Weekly rota
        </h3>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowPreviousModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-base font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <IconList className="w-4 h-4" />
              Previous rota
            </button>
          )}
          {!readOnly && (
            <p className="text-slate-600 text-sm">
              You can edit this week and the next two weeks only.
            </p>
          )}
        </div>
      </div>
      {error && (
        <div className="mx-6 mt-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-base">
          {error}
        </div>
      )}

      <div className="p-6 space-y-8">
        {weeks.map((week) => {
          const weekShifts = shifts.filter((s) => s.weekStartDate === week.weekStartDate);
          const canEdit = !readOnly && week.isEditable;
          return (
            <section key={week.weekStartDate} className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  {week.label}
                  <span className="text-slate-600 font-normal ml-2">
                    ({formatWeekRange(week.weekStartDate)})
                  </span>
                </span>
                {!week.isEditable && (
                  <span className="text-slate-500 text-sm">Read-only</span>
                )}
              </div>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 min-w-[700px]">
                  {DISPLAY_DAY_ORDER.map((dayOfWeek) => {
                    const dayShifts = weekShifts.filter((s) => s.dayOfWeek === dayOfWeek);
                    const addKey = adding?.weekStart === week.weekStartDate && adding?.dayOfWeek === dayOfWeek;
                    return (
                      <div
                        key={`${week.weekStartDate}-${dayOfWeek}`}
                        className="border-r border-slate-200 last:border-r-0 p-4 min-h-[180px] flex flex-col"
                      >
                        <div className="font-semibold text-slate-800 text-sm mb-2 uppercase tracking-wide">
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
                                <p className="font-medium text-slate-900 truncate">
                                  {shift.employeeName ?? "—"}
                                </p>
                                <p className="text-slate-700 text-sm mt-0.5">
                                  {shift.startTime} – {shift.endTime}
                                </p>
                                {canEdit && (
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
                          {addKey ? (
                            <AddShiftForm
                              weekStartDate={week.weekStartDate}
                              dayOfWeek={dayOfWeek}
                              employees={employees}
                              onAdd={(employeeId, startTime, endTime) =>
                                handleAdd(week.weekStartDate, dayOfWeek, employeeId, startTime, endTime)
                              }
                              onCancel={() => setAdding(null)}
                              saving={saving}
                            />
                          ) : canEdit ? (
                            <button
                              type="button"
                              onClick={() =>
                                setAdding({ weekStart: week.weekStartDate, dayOfWeek })
                              }
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
            </section>
          );
        })}
      </div>

      {showPreviousModal && !readOnly && (
        <PreviousRotaModal
          businessId={businessId}
          onClose={() => setShowPreviousModal(false)}
        />
      )}
    </div>
  );
}

function AddShiftForm({
  weekStartDate,
  dayOfWeek,
  employees,
  onAdd,
  onCancel,
  saving,
}: {
  weekStartDate: string;
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

interface PreviousRotaModalProps {
  businessId: string;
  onClose: () => void;
}

function PreviousRotaModal({ businessId, onClose }: PreviousRotaModalProps) {
  const [months, setMonths] = useState<{ key: string; label: string }[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthShifts, setMonthShifts] = useState<RotaShift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);

  useEffect(() => {
    async function load() {
      setLoadingMonths(true);
      try {
        const res = await fetch(`/api/businesses/${businessId}/rota/months?limit=12`);
        const data = await res.json();
        if (res.ok) {
          setMonths(data.months.map((m: { key: string; label: string }) => ({ key: m.key, label: m.label })));
          setNextCursor(data.nextCursor);
        }
      } finally {
        setLoadingMonths(false);
      }
    }
    load();
  }, [businessId]);

  async function loadMoreMonths() {
    if (!nextCursor) return;
    const res = await fetch(
      `/api/businesses/${businessId}/rota/months?limit=12&cursor=${encodeURIComponent(nextCursor)}`
    );
    const data = await res.json();
    if (res.ok && data.months?.length) {
      setMonths((prev) => [...prev, ...data.months.map((m: { key: string; label: string }) => ({ key: m.key, label: m.label }))]);
      setNextCursor(data.nextCursor);
    }
  }

  async function selectMonth(monthKey: string) {
    setSelectedMonth(monthKey);
    setLoadingShifts(true);
    try {
      const res = await fetch(
        `/api/businesses/${businessId}/rota?month=${encodeURIComponent(monthKey)}`
      );
      const data = await res.json();
      if (res.ok) setMonthShifts(data);
      else setMonthShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  }

  const shiftsByWeek = monthShifts.reduce<Record<string, RotaShift[]>>((acc, s) => {
    const w = s.weekStartDate;
    if (!acc[w]) acc[w] = [];
    acc[w].push(s);
    return acc;
  }, {});
  const weekDates = Object.keys(shiftsByWeek).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900 uppercase tracking-wide">
            Previous rota by month
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            aria-label="Close"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex min-h-0">
          <div className="w-56 shrink-0 border-r border-slate-200 overflow-y-auto p-3">
            {loadingMonths ? (
              <p className="text-slate-500 text-sm">Loading months…</p>
            ) : months.length === 0 ? (
              <p className="text-slate-500 text-sm">No previous rota data.</p>
            ) : (
              <ul className="space-y-1">
                {months.map((m) => (
                  <li key={m.key}>
                    <button
                      type="button"
                      onClick={() => selectMonth(m.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                        selectedMonth === m.key
                          ? "bg-cyan-100 text-cyan-800"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {m.label}
                    </button>
                  </li>
                ))}
                {nextCursor && (
                  <li className="pt-2">
                    <button
                      type="button"
                      onClick={loadMoreMonths}
                      className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-cyan-600 hover:bg-cyan-50"
                    >
                      Load more months…
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedMonth && (
              <p className="text-slate-500 text-center py-8">Select a month to view its rota.</p>
            )}
            {selectedMonth && loadingShifts && (
              <p className="text-slate-500 text-center py-8">Loading rota…</p>
            )}
            {selectedMonth && !loadingShifts && weekDates.length === 0 && (
              <p className="text-slate-500 text-center py-8">No shifts for this month.</p>
            )}
            {selectedMonth && !loadingShifts && weekDates.length > 0 && (
              <div className="space-y-6">
                {weekDates.map((weekStart) => (
                  <section key={weekStart} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-sm font-medium text-slate-800">
                      Week of {formatWeekRange(weekStart)}
                    </div>
                    <div className="overflow-x-auto">
                      <div className="grid grid-cols-7 min-w-[600px]">
                        {DISPLAY_DAY_ORDER.map((dayOfWeek) => {
                          const dayShifts = (shiftsByWeek[weekStart] ?? []).filter(
                            (s) => s.dayOfWeek === dayOfWeek
                          );
                          return (
                            <div
                              key={dayOfWeek}
                              className="border-r border-slate-200 last:border-r-0 p-3 min-h-[100px]"
                            >
                              <div className="font-semibold text-slate-700 text-xs mb-2 uppercase">
                                {DAY_NAMES[dayOfWeek]}
                              </div>
                              <div className="space-y-1.5">
                                {dayShifts.map((shift) => (
                                  <div
                                    key={shift.id}
                                    className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
                                  >
                                    <p className="font-medium text-slate-900 truncate">
                                      {shift.employeeName ?? "—"}
                                    </p>
                                    <p className="text-slate-600">
                                      {shift.startTime} – {shift.endTime}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
