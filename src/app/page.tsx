import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

function canAccessDashboard(user: { role?: string; isEmployer?: boolean }) {
  return (user as { isEmployer?: boolean }).isEmployer ?? user.role === "employer";
}
function canAccessMyPayslips(user: { role?: string; isEmployee?: boolean }) {
  return (user as { isEmployee?: boolean }).isEmployee ?? user.role === "employee";
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    if (canAccessDashboard(session.user)) redirect("/dashboard");
    if (canAccessMyPayslips(session.user)) redirect("/my-payslips");
  }

  const faqs = [
    {
      q: "How do I invite an employee?",
      a: "Sign up or log in as a business owner, create or select a business, then use Add Employee. Enter their name and email—they’ll receive an invite link to set a password and access their payslips.",
    },
    {
      q: "How do I send a payslip?",
      a: "Go to your business, pick an employee from the list, and click Send payslip (or use Bulk send & schedule to upload multiple PDFs and assign each to an employee). You can send now or schedule for a future date.",
    },
    {
      q: "Where do employees see their payslips?",
      a: "Employees log in and go to My payslips. They can view and download any payslips you’ve sent them.",
    },
    {
      q: "I’m an employee—how do I get access?",
      a: "Your employer adds you and sends an invite email. Use the link in that email (or go to Activate my account) to set your password. Then log in to view your payslips.",
    },
    {
      q: "Can I schedule payslips to send later?",
      a: "Yes. Use Bulk send & schedule payslips, upload your PDFs, assign employees, set a date and time, then click Schedule. Payslips are sent automatically at that time.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 text-slate-800 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Payslip Portal
        </h1>
        <p className="text-slate-700 text-base mb-10">
          Business owners: manage staff and send payslips. Employees: view your payslips and information.
        </p>

        <div className="space-y-6">
          <section className="rounded-2xl border border-cyan-200/80 bg-white/90 shadow-lg shadow-cyan-500/10 p-6 text-left backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              I&apos;m a business owner
            </h2>
            <p className="text-slate-700 text-base mb-4">
              Manage your businesses, staff, and send payslips.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login?callbackUrl=/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base py-2.5 px-5 transition-colors shadow-md shadow-cyan-500/25"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 py-2.5 px-5 transition-colors font-medium text-base"
              >
                Sign up
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-200/80 bg-white/90 shadow-lg shadow-cyan-500/10 p-6 text-left backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              I&apos;m an employee
            </h2>
            <p className="text-slate-700 text-base mb-4">
              View your payslips and your employee information. You need to be invited by your employer first.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login?callbackUrl=/my-payslips"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-base py-2.5 px-5 transition-colors shadow-md shadow-cyan-500/25"
              >
                Log in
              </Link>
              <Link
                href="/invite/accept"
                className="inline-flex items-center justify-center rounded-xl border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 py-2.5 px-5 transition-colors font-medium text-base"
              >
                Activate my account
              </Link>
            </div>
            <p className="text-slate-700 text-base mt-3">
              First time? Use the link in your invite email to activate your account, or click &quot;Activate my account&quot; and enter the token from the email.
            </p>
          </section>
        </div>

        {/* FAQ */}
        <section className="mt-14 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Frequently asked questions
          </h2>
          <ul className="space-y-4">
            {faqs.map((faq, i) => (
              <li
                key={i}
                className="rounded-2xl border border-cyan-200/80 bg-white/90 shadow-md shadow-cyan-500/5 p-5 text-left backdrop-blur-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-slate-700 text-base leading-relaxed">
                  {faq.a}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
