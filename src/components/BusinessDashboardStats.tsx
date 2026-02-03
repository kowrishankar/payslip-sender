"use client";

import { useEffect, useState } from "react";

interface EmployeePayment {
  id: string;
  name: string;
  email: string;
  paymentCount: number;
  totalAmountCents: number;
}

interface DashboardStats {
  totalPayments: number;
  paymentsThisWeek: number;
  paymentsThisMonth: number;
  totalAmountCentsThisWeek: number;
  totalAmountCentsThisMonth: number;
  employeeCount: number;
  employeesWithPayments: EmployeePayment[];
}

interface BusinessDashboardStatsProps {
  businessId: string;
  refreshTrigger?: number;
}

function formatMoney(cents: number): string {
  if (cents === 0) return "—";
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BusinessDashboardStats({
  businessId,
  refreshTrigger = 0,
}: BusinessDashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/businesses/${businessId}/dashboard-stats`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId, refreshTrigger]);

  if (loading || !stats) {
    return (
      <div className="py-10 text-center text-slate-700 text-lg font-medium">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow">
          <p className="text-black text-lg font-medium mb-2">Total payments</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalPayments}</p>
          <p className="text-lg text-slate-600 mt-1">All time</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow">
          <p className="text-black text-lg font-medium mb-2">Payments this week</p>
          <p className="text-3xl font-bold text-cyan-500">{stats.paymentsThisWeek}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow">
          <p className="text-black text-lg font-medium mb-2">Payments this month</p>
          <p className="text-3xl font-bold text-cyan-600">{stats.paymentsThisMonth}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow">
          <p className="text-black text-lg font-medium mb-2">Paid this week</p>
          <p className="text-2xl font-semibold text-slate-900">
            {formatMoney(stats.totalAmountCentsThisWeek)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow">
          <p className="text-black text-lg font-medium mb-2">Paid this month</p>
          <p className="text-2xl font-semibold text-slate-900">
            {formatMoney(stats.totalAmountCentsThisMonth)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow">
          <p className="text-black text-lg font-medium mb-2">Total employees</p>
          <p className="text-3xl font-bold text-cyan-600">{stats.employeeCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-card">
        <h3 className="text-slate-900 font-semibold text-xl px-6 py-4 border-b border-slate-200 bg-slate-50 uppercase tracking-wide">
          Employees & payments
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-lg">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-slate-800 font-semibold px-6 py-4 uppercase tracking-wide">Employee</th>
                <th className="text-right text-slate-800 font-semibold px-6 py-4 uppercase tracking-wide">Payments</th>
                <th className="text-right text-slate-800 font-semibold px-6 py-4 uppercase tracking-wide">Total amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.employeesWithPayments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-700 text-lg">
                    No employees or payments yet.
                  </td>
                </tr>
              ) : (
                stats.employeesWithPayments.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-slate-100 hover:bg-cyan-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-900 font-medium text-lg">{emp.name}</td>
                    <td className="px-6 py-4 text-right text-slate-700 text-lg">{emp.paymentCount}</td>
                    <td className="px-6 py-4 text-right text-slate-900 font-medium text-lg">
                      {formatMoney(emp.totalAmountCents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
