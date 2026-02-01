import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import BusinessListClient from "./BusinessListClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "employer") {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <main className="min-h-screen bg-cyan-50 text-slate-900 px-6 sm:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <BusinessListClient userName={session.user.name ?? "Employer"} />
      </div>
    </main>
  );
}
