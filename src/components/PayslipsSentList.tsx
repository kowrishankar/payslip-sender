"use client";

import { useEffect, useState, useRef } from "react";

export interface PayslipSent {
  id: string;
  fileName: string;
  employeeName: string;
  employeeEmail: string;
  emailMessage?: string;
  createdAt: string;
}

interface PayslipsSentListProps {
  businessId?: string;
  employeeId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  employees?: { id: string; name: string }[];
  refreshTrigger?: number;
}

export default function PayslipsSentList({
  businessId,
  employeeId,
  from,
  to,
  employees = [],
  refreshTrigger = 0,
}: PayslipsSentListProps) {
  const [payslips, setPayslips] = useState<PayslipSent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState(employeeId ?? "");
  const [filterFrom, setFilterFrom] = useState(from ?? "");
  const [filterTo, setFilterTo] = useState(to ?? "");
  const [employeeOptions, setEmployeeOptions] = useState<{ id: string; name: string }[]>(employees);
  const employeesFetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (employees.length > 0) {
      setEmployeeOptions(employees);
      return;
    }
    if (!businessId || employeesFetchedFor.current === businessId) return;
    employeesFetchedFor.current = businessId;
    fetch(`/api/businesses/${businessId}/employees`)
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) setEmployeeOptions(list.map((e: { id: string; name: string }) => ({ id: e.id, name: e.name })));
      })
      .catch(() => {});
  }, [businessId, employees.length]);

  useEffect(() => {
    async function fetchPayslips() {
      setLoading(true);
      try {
        let url: string;
        if (businessId) {
          const params = new URLSearchParams();
          if (filterEmployee) params.set("employeeId", filterEmployee);
          if (filterFrom) params.set("from", filterFrom);
          if (filterTo) params.set("to", filterTo);
          url = `/api/businesses/${businessId}/payslips?${params.toString()}`;
        } else {
          const params = new URLSearchParams();
          if (businessId) params.set("businessId", businessId);
          if (filterEmployee) params.set("employeeId", filterEmployee);
          if (filterFrom) params.set("from", filterFrom);
          if (filterTo) params.set("to", filterTo);
          url = `/api/payslips?${params.toString()}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) setPayslips(data);
      } finally {
        setLoading(false);
      }
    }
    fetchPayslips();
  }, [refreshTrigger, businessId, filterEmployee, filterFrom, filterTo]);

  if (loading) {
    return (
      <div className="text-slate-700 py-6 text-center text-base font-medium">
        Loading payslip history…
      </div>
    );
  }

  const showFilters = !!businessId;

  function setThisWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    setFilterFrom(monday.toISOString().slice(0, 10));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setFilterTo(sunday.toISOString().slice(0, 10));
  }

  function setThisMonth() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFilterFrom(first.toISOString().slice(0, 10));
    setFilterTo(last.toISOString().slice(0, 10));
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-3 items-end rounded-xl border border-cyan-200/80 bg-white p-4 shadow-sm">
          <div>
            <label className="block text-base font-medium text-slate-800 mb-1">Employee</label>
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            >
              <option value="">All</option>
              {employeeOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-medium text-slate-800 mb-1">From (date)</label>
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-slate-800 mb-1">To (date)</label>
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-base focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={setThisWeek}
              className="px-3 py-2 rounded-xl text-base font-medium border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              This week
            </button>
            <button
              type="button"
              onClick={setThisMonth}
              className="px-3 py-2 rounded-xl text-base font-medium border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              This month
            </button>
          </div>
        </div>
      )}
      {payslips.length === 0 ? (
        <div className="rounded-xl border border-cyan-200/80 bg-white p-6 text-center text-slate-700 text-base">
          No payslips sent yet. Send a payslip from the Staff section above.
        </div>
      ) : (
    <ul className="space-y-3">
      {payslips.map((p) => (
        <li
          key={p.id}
          className="rounded-xl border border-cyan-200/80 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 text-base">{p.employeeName}</p>
              <p className="text-base text-slate-700 truncate">{p.employeeEmail}</p>
              <p className="text-base text-slate-700 mt-1">{p.fileName}</p>
              {p.emailMessage && (
                <p className="text-base text-slate-600 mt-2 line-clamp-2 border-l-2 border-slate-200 pl-2">
                  {p.emailMessage}
                </p>
              )}
            </div>
            <time
              dateTime={p.createdAt}
              className="text-base text-slate-600 shrink-0 whitespace-nowrap font-medium"
            >
              {new Date(p.createdAt).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}{" "}
              {new Date(p.createdAt).toLocaleTimeString(undefined, {
                timeStyle: "short",
              })}
            </time>
          </div>
        </li>
      ))}
    </ul>
      )}
    </div>
  );
}
