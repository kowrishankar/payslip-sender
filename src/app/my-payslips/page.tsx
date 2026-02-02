import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MyPayslipsClient from "./MyPayslipsClient";

export default async function MyPayslipsPage() {
  const session = await getServerSession(authOptions);
  const canAccess = (session?.user as { isEmployee?: boolean })?.isEmployee ?? session?.user?.role === "employee";
  if (!session?.user || !canAccess) {
    redirect("/login?callbackUrl=/my-payslips");
  }

  const isEmployer = (session.user as { isEmployer?: boolean }).isEmployer ?? session.user.role === "employer";
  return (
    <main className="min-h-screen bg-cyan-50 text-slate-900 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <MyPayslipsClient userName={session.user.name ?? "Employee"} isEmployer={isEmployer} />
      </div>
    </main>
  );
}
