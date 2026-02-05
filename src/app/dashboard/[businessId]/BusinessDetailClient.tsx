"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import AddEmployeeForm from "@/components/AddEmployeeForm";
import EmployeeList from "@/components/EmployeeList";
import SendPayslipForm from "@/components/SendPayslipForm";
import BulkSendPayslipForm from "@/components/BulkSendPayslipForm";
import EditEmployeeForm from "@/components/EditEmployeeForm";
import SendCustomEmailForm from "@/components/SendCustomEmailForm";
import PayslipsSentList from "@/components/PayslipsSentList";
import ScheduledPayslipsList from "@/components/ScheduledPayslipsList";
import PayReminder from "@/components/PayReminder";
import BusinessSettings from "@/components/BusinessSettings";
import BusinessDashboardStats from "@/components/BusinessDashboardStats";
import { IconCog, IconList, IconPlus, IconDocument, IconLogout, IconHome } from "@/components/Icons";
import type { Employee } from "@/components/EmployeeList";

const barChartIcon = (
  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const chevronUp = (
  <svg className="w-5 h-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const chevronDown = (
  <svg className="w-5 h-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

type ActivePanel = "business" | "payslips" | "add" | null;

interface BusinessDetailClientProps {
  businessId: string;
  businessName: string;
  businessAddress?: string;
  businessLogoUrl?: string;
  businessLogoPath?: string;
  payCycle?: string;
  payDayOfWeek?: number;
  payDayOfMonth?: number;
  userName: string;
  isEmployee?: boolean;
}

export default function BusinessDetailClient({
  businessId,
  businessName,
  businessAddress,
  businessLogoUrl,
  businessLogoPath,
  payCycle,
  payDayOfWeek,
  payDayOfMonth,
  userName,
  isEmployee = false,
}: BusinessDetailClientProps) {
  const logoSrc = businessLogoPath
    ? `/api/businesses/${businessId}/logo`
    : businessLogoUrl || null;
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [employeeRefreshTrigger, setEmployeeRefreshTrigger] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeForEmail, setEmployeeForEmail] = useState<Employee | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showBulkSendModal, setShowBulkSendModal] = useState(false);

  const onSuccess = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
  }, []);

  const onEmployeeSuccess = useCallback(() => {
    setEmployeeRefreshTrigger((n) => n + 1);
  }, []);

  return (
    <div className="min-h-screen px-6 sm:px-8 lg:px-12">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm -mx-6 sm:-mx-8 lg:-mx-12 px-6 sm:px-8 lg:px-12">
        <div className="max-w-[1920px] mx-auto py-5 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5 min-w-0">
            {logoSrc && (
              <img
                src={logoSrc}
                alt=""
                className="h-12 w-12 object-contain rounded-lg border border-slate-200 shrink-0 shadow-card"
              />
            )}
            <div className="min-w-0">
              <Link
                href="/dashboard"
                className="text-lg text-cyan-600 hover:text-cyan-700 transition-colors block font-medium"
              >
                ← All businesses
              </Link>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 truncate mt-1 uppercase tracking-wide">
                {businessName}
              </h1>
              {businessAddress && (
                <p className="text-slate-700 text-lg truncate mt-0.5">{businessAddress}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-5 shrink-0 flex-wrap">
            <span className="text-slate-800 text-lg font-medium">{userName}</span>
            {isEmployee && (
              <Link href="/my-payslips" className="inline-flex items-center gap-1.5 text-lg text-slate-600 hover:text-cyan-600 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-50 font-medium uppercase tracking-wide">
                <IconDocument className="w-4 h-4" />
                My payslips
              </Link>
            )}
            <Link href="/" className="inline-flex items-center gap-1.5 text-lg text-slate-600 hover:text-cyan-600 transition-colors py-2 px-3 rounded-xl hover:bg-cyan-50 font-medium uppercase tracking-wide">
              <IconHome className="w-4 h-4" />
              Home
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-1.5 text-lg text-slate-600 hover:text-rose-500 transition-colors py-2 px-3 rounded-lg hover:bg-rose-50 font-medium uppercase tracking-wide"
            >
              <IconLogout className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Top action buttons */}
      <div className="max-w-[1920px] mx-auto py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "business" ? null : "business")}
            className={`rounded-xl border px-5 py-4 text-left text-lg font-medium transition-all shadow-card inline-flex items-center gap-3 ${
              activePanel === "business"
                ? "border-cyan-400 bg-cyan-50 text-cyan-800 shadow-card-hover"
                : "border-slate-200 bg-white text-slate-800 hover:border-cyan-200 hover:bg-cyan-50/50"
            }`}
          >
            <IconCog className="w-5 h-5" />
            Manage Business Details
          </button>
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === "payslips" ? null : "payslips")}
            className={`rounded-xl border px-5 py-4 text-left text-lg font-medium transition-all shadow-card inline-flex items-center gap-3 ${
              activePanel === "payslips"
                ? "border-cyan-400 bg-cyan-50 text-cyan-800 shadow-card-hover"
                : "border-slate-200 bg-white text-slate-800 hover:border-cyan-200 hover:bg-cyan-50/50"
            }`}
          >
            <IconList className="w-5 h-5" />
            View Previous Payslips
          </button>
          <button
            type="button"
            onClick={() => setShowAddEmployeeModal(true)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-left text-lg font-medium text-slate-800 shadow-card hover:border-cyan-200 hover:bg-cyan-50/50 transition-all tracking-wide inline-flex items-center gap-3"
          >
            <IconPlus className="w-5 h-5" />
            Add Employee
          </button>
          <button
            type="button"
            onClick={() => setShowBulkSendModal(true)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-left text-lg font-medium text-slate-800 shadow-card hover:border-cyan-200 hover:bg-cyan-50/50 transition-all tracking-wide inline-flex items-center gap-3"
          >
            <IconDocument className="w-5 h-5" />
            Bulk Send &amp; Schedule Payslips
          </button>
        </div>

        {/* Expanded panel content below buttons */}
        {activePanel === "business" && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 text-lg shadow-card">
            <BusinessSettings
              businessId={businessId}
              businessName={businessName}
              businessAddress={businessAddress}
              businessLogoUrl={businessLogoUrl}
              businessLogoPath={businessLogoPath}
              onUpdate={onSuccess}
            />
            <div className="mt-10 pt-8 border-t border-slate-200">
              <PayReminder
                businessId={businessId}
                payCycle={payCycle}
                payDayOfWeek={payDayOfWeek}
                payDayOfMonth={payDayOfMonth}
                onUpdate={onSuccess}
                embedded
              />
            </div>
          </div>
        )}
        {activePanel === "payslips" && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 text-lg shadow-card">
            <PayslipsSentList businessId={businessId} refreshTrigger={refreshTrigger} />
          </div>
        )}

        {/* Scheduled payslips – show pending jobs with edit / cancel / send now */}
        <div className="mt-5">
          <ScheduledPayslipsList
            businessId={businessId}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>

      {/* Add Employee modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cyan-200/80 bg-white shadow-xl shadow-cyan-500/10 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 uppercase tracking-wide">Add employee</h3>
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(false)}
                className="text-slate-500 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <AddEmployeeForm
              businessId={businessId}
              onSuccess={() => {
                onEmployeeSuccess();
                setShowAddEmployeeModal(false);
              }}
              onClose={() => setShowAddEmployeeModal(false)}
            />
          </div>
        </div>
      )}

      {/* Two-column: Dashboard (left) + Employee table (right) */}
      <div className="max-w-[1920px] mx-auto pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Dashboard (collapsible) */}
          <div className="lg:col-span-2">
            <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-card">
              <button
                type="button"
                onClick={() => setDashboardOpen(!dashboardOpen)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-slate-50 hover:bg-cyan-50/50 transition-colors text-lg"
                aria-expanded={dashboardOpen}
              >
                <span className="flex items-center gap-3 font-semibold text-slate-800 text-lg">
                  <span className="text-cyan-500">{barChartIcon}</span>
                  Dashboard
                </span>
                <span className="text-slate-400">{dashboardOpen ? chevronUp : chevronDown}</span>
              </button>
              {dashboardOpen && (
                <div className="border-t border-slate-200 p-6 bg-white">
                  <p className="text-slate-700 text-lg mb-5 font-medium">Recent updates & payment metrics</p>
                  <BusinessDashboardStats businessId={businessId} refreshTrigger={refreshTrigger} />
                </div>
              )}
            </section>
          </div>

          {/* Right: Table list of employees (same colours & fonts as dashboard) */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden sticky top-24 shadow-card">
<h3 className="text-slate-900 font-semibold text-2xl px-5 py-4 border-b border-slate-200 bg-slate-50 uppercase tracking-wide">
                  Table list of employees
              </h3>
              <div className="p-0 min-h-[200px]">
                <EmployeeList
                  businessId={businessId}
                  refreshTrigger={employeeRefreshTrigger}
                  variant="table"
                  onSelectForPayslip={setSelectedEmployee}
                  onEdit={setEmployeeToEdit}
                  onSendCustomEmail={setEmployeeForEmail}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedEmployee && (
        <SendPayslipForm
          businessId={businessId}
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSuccess={onSuccess}
        />
      )}
      {employeeToEdit && (
        <EditEmployeeForm
          businessId={businessId}
          employee={employeeToEdit}
          onClose={() => setEmployeeToEdit(null)}
          onSuccess={onEmployeeSuccess}
        />
      )}
      {employeeForEmail && (
        <SendCustomEmailForm
          businessId={businessId}
          employee={employeeForEmail}
          onClose={() => setEmployeeForEmail(null)}
          onSuccess={onSuccess}
        />
      )}
      {showBulkSendModal && (
        <BulkSendPayslipForm
          businessId={businessId}
          onClose={() => setShowBulkSendModal(false)}
          onSuccess={() => {
            onSuccess();
            setRefreshTrigger((n) => n + 1);
            setShowBulkSendModal(false);
          }}
        />
      )}
    </div>
  );
}
