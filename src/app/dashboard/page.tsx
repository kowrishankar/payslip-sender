import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BusinessListClient from "./BusinessListClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const canAccess = (session?.user as { isEmployer?: boolean })?.isEmployer ?? session?.user?.role === "employer";
  if (!session?.user || !canAccess) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const isEmployee = (session.user as { isEmployee?: boolean }).isEmployee ?? session.user.role === "employee";
  return (
    <main className="min-h-screen bg-cyan-50 text-slate-900 px-6 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <BusinessListClient userName={session.user.name ?? "Employer"} isEmployee={isEmployee} />
      </div>
    </main>
  );
}
