import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "employer") redirect("/dashboard");
  if (session?.user?.role === "employee") redirect("/my-payslips");

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 text-slate-800 flex flex-col items-center justify-center px-4">
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
      </div>
    </main>
  );
}
