"use client";

import { useEffect, useState } from "react";

export interface Employee {
  id: string;
  name: string;
  email: string;
  department?: string;
  startDate?: string;
  address?: string;
  contactNumber?: string;
  createdAt: string;
  payCycle?: string;
  payDayOfWeek?: number;
  payDayOfMonth?: number;
  daysUntilPaymentDue?: number | null;
}

interface EmployeeListProps {
  businessId?: string;
  onSelectForPayslip?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onSendCustomEmail?: (employee: Employee) => void;
  refreshTrigger?: number;
  /** Table layout for sidebar (light background) */
  variant?: "cards" | "table";
}

export default function EmployeeList({
  businessId,
  onSelectForPayslip,
  onEdit,
  onSendCustomEmail,
  refreshTrigger = 0,
  variant = "cards",
}: EmployeeListProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchEmployees() {
    if (!businessId) {
      setLoading(false);
      setEmployees([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/employees`);
      const data = await res.json();
      if (res.ok) setEmployees(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, [refreshTrigger, businessId]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this employee from the list?")) return;
    setDeletingId(id);
    if (!businessId) return;
    try {
      const res = await fetch(`/api/businesses/${businessId}/employees/${id}`, { method: "DELETE" });
      if (res.ok) setEmployees((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const emptyClass = variant === "table"
    ? "text-slate-700 py-8 text-center text-base"
    : "text-slate-700 py-8 text-center text-base rounded-xl border border-cyan-200/80 bg-white shadow-sm";

  if (loading) {
    return (
      <div className={variant === "table" ? "text-slate-700 py-6 text-center text-base font-medium" : "text-slate-700 py-8 text-center text-base font-medium"}>
        Loading employees…
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className={emptyClass}>
        No employees yet. Add one using &quot;Add Employee&quot;.
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-slate-800 font-semibold text-base px-5 py-4">Name</th>
              <th className="text-left text-slate-800 font-semibold text-base px-5 py-4">Days until payment due</th>
              {onSelectForPayslip && (
                <th className="text-right text-slate-800 font-semibold text-base px-5 py-4">Send payslip</th>
              )}
              {onEdit && (
                <th className="text-right text-slate-800 font-semibold text-base px-5 py-4">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-100 hover:bg-cyan-50/50 transition-colors">
                <td className="px-5 py-4 text-slate-900 font-medium text-base">{emp.name}</td>
                <td className="px-5 py-4 text-slate-700 text-base">
                  {emp.daysUntilPaymentDue != null
                    ? emp.daysUntilPaymentDue === 0
                      ? "Today"
                      : emp.daysUntilPaymentDue === 1
                        ? "1 day"
                        : `${emp.daysUntilPaymentDue} days`
                    : "—"}
                </td>
                {onSelectForPayslip && (
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectForPayslip(emp)}
                      className="text-cyan-600 hover:text-cyan-700 text-base font-medium transition-colors py-2 px-3 rounded-lg hover:bg-cyan-50 min-h-[2.5rem]"
                    >
                      Send payslip
                    </button>
                  </td>
                )}
                {onEdit && (
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(emp)}
                      className="text-slate-600 hover:text-slate-800 text-base font-medium transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 min-h-[2.5rem]"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {employees.map((emp) => (
        <li
          key={emp.id}
          className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-cyan-200/80 bg-white hover:border-cyan-300 hover:shadow-sm transition-colors"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900 text-base truncate">{emp.name}</p>
            <p className="text-base text-slate-700 truncate">{emp.email}</p>
            {(emp.department || emp.contactNumber || emp.startDate) && (
              <p className="text-base text-slate-600 mt-0.5">
                {[emp.department, emp.contactNumber, emp.startDate && `Start: ${emp.startDate}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {emp.address && (
              <p className="text-base text-slate-600 truncate mt-0.5" title={emp.address}>
                {emp.address}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(emp)}
                className="inline-flex items-center gap-1.5 text-base font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-1.5 rounded-lg border border-transparent hover:bg-slate-100"
                title="Edit employee"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit
              </button>
            )}
            {onSendCustomEmail && (
              <button
                type="button"
                onClick={() => onSendCustomEmail(emp)}
                className="inline-flex items-center gap-1.5 text-base font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-1.5 rounded-lg border border-transparent hover:bg-slate-100"
                title="Send customised email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Email
              </button>
            )}
            {onSelectForPayslip && (
              <button
                type="button"
                onClick={() => onSelectForPayslip(emp)}
                className="inline-flex items-center gap-1.5 text-base font-medium text-cyan-600 hover:text-cyan-700 transition-colors px-2 py-1.5 rounded-lg border border-transparent hover:bg-cyan-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Send payslip
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(emp.id)}
              disabled={deletingId === emp.id}
              className="inline-flex items-center gap-1.5 text-base font-medium text-slate-700 hover:text-red-600 transition-colors disabled:opacity-50 px-2 py-1.5 rounded-lg border border-transparent hover:bg-red-50"
              title="Remove employee"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10v10a2 2 0 002 2h12a2 2 0 002-2V10M4 6L9 6M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2m-6 0V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v2" /></svg>
              {deletingId === emp.id ? "…" : "Remove"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
