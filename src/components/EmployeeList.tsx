"use client";

import { useEffect, useState } from "react";
import { IconDocument, IconPencil, IconTrash, IconEnvelope } from "@/components/Icons";

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
    ? "text-slate-700 py-8 text-center text-lg"
    : "text-slate-700 py-8 text-center text-lg rounded-xl border border-cyan-200/80 bg-white shadow-sm";

  if (loading) {
    return (
      <div className={variant === "table" ? "text-slate-700 py-6 text-center text-lg font-medium" : "text-slate-700 py-8 text-center text-lg font-medium"}>
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
        <table className="w-full text-lg">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left text-slate-800 font-semibold text-lg px-5 py-4 tracking-wide">Name</th>
              <th className="text-left text-slate-800 font-semibold text-lg px-5 py-4 tracking-wide">Days until payment due</th>
              {onSelectForPayslip && (
                <th className="text-right text-slate-800 font-semibold text-lg px-5 py-4 tracking-wide">Send payslip</th>
              )}
              {(onEdit || businessId) && (
                <th className="text-right text-slate-800 font-semibold text-lg px-5 py-4 tracking-wide">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-100 hover:bg-cyan-50/50 transition-colors">
                <td className="px-5 py-4 text-slate-900 font-medium text-lg">{emp.name}</td>
                <td className="px-5 py-4 text-slate-700 text-lg">
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
                      className="inline-flex items-center gap-1.5 text-cyan-600 hover:text-cyan-700 text-lg font-medium transition-colors py-2 px-3 rounded-lg hover:bg-cyan-50 min-h-[2.5rem] tracking-wide"
                    >
                      <IconDocument className="w-4 h-4" />
                      Send Payslip
                    </button>
                  </td>
                )}
                {(onEdit || businessId) && (
                  <td className="px-5 py-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(emp)}
                          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 text-lg font-medium transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 min-h-[2.5rem] tracking-wide"
                        >
                          <IconPencil className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(emp.id)}
                        disabled={deletingId === emp.id}
                        className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 text-lg font-medium transition-colors py-2 px-3 rounded-lg hover:bg-red-50 min-h-[2.5rem] disabled:opacity-50 tracking-wide"
                        title="Remove employee"
                      >
                        <IconTrash className="w-4 h-4" />
                        {deletingId === emp.id ? "…" : "Remove"}
                      </button>
                    </div>
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
            <p className="font-medium text-slate-900 text-lg truncate">{emp.name}</p>
            <p className="text-lg text-slate-700 truncate">{emp.email}</p>
            {(emp.department || emp.contactNumber || emp.startDate) && (
              <p className="text-lg text-slate-600 mt-0.5">
                {[emp.department, emp.contactNumber, emp.startDate && `Start: ${emp.startDate}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {emp.address && (
              <p className="text-lg text-slate-600 truncate mt-0.5" title={emp.address}>
                {emp.address}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(emp)}
                className="inline-flex items-center gap-1.5 text-lg font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-1.5 rounded-lg border border-transparent hover:bg-slate-100 uppercase tracking-wide"
                title="Edit employee"
              >
                <IconPencil className="w-4 h-4" />
                Edit
              </button>
            )}
            {onSendCustomEmail && (
              <button
                type="button"
                onClick={() => onSendCustomEmail(emp)}
                className="inline-flex items-center gap-1.5 text-lg font-medium text-slate-700 hover:text-slate-900 transition-colors px-2 py-1.5 rounded-lg border border-transparent hover:bg-slate-100 uppercase tracking-wide"
                title="Send customised email"
              >
                <IconEnvelope className="w-4 h-4" />
                Email
              </button>
            )}
            {onSelectForPayslip && (
              <button
                type="button"
                onClick={() => onSelectForPayslip(emp)}
                className="inline-flex items-center gap-1.5 text-lg font-medium text-cyan-600 hover:text-cyan-700 transition-colors px-2 py-1.5 rounded-lg border border-transparent hover:bg-cyan-50 uppercase tracking-wide"
              >
                <IconDocument className="w-4 h-4" />
                Send payslip
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(emp.id)}
              disabled={deletingId === emp.id}
              className="inline-flex items-center gap-1.5 text-lg font-medium text-slate-700 hover:text-red-600 transition-colors disabled:opacity-50 px-2 py-1.5 rounded-lg border border-transparent hover:bg-red-50 uppercase tracking-wide"
              title="Remove employee"
            >
              <IconTrash className="w-4 h-4" />
              {deletingId === emp.id ? "…" : "Remove"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
