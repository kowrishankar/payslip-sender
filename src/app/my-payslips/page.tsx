import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MyPayslipsClient from "./MyPayslipsClient";

export default async function MyPayslipsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "employee") {
    redirect("/login?callbackUrl=/my-payslips");
  }

  return (
    <main className="min-h-screen bg-cyan-50 text-slate-900 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <MyPayslipsClient userName={session.user.name ?? "Employee"} />
      </div>
    </main>
  );
}
