import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BusinessDetailClient from "./BusinessDetailClient";

export default async function BusinessDashboardPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "employer") {
    redirect("/login?callbackUrl=/dashboard");
  }
  const { businessId } = await params;
  const business = await prisma.business.findFirst({
    where: { id: businessId, employerId: session.user.id },
  });
  if (!business) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-cyan-50 text-slate-900">
      <BusinessDetailClient
        businessId={business.id}
        businessName={business.name}
        businessAddress={business.address ?? undefined}
        businessLogoUrl={business.logoUrl ?? undefined}
        businessLogoPath={business.logoPath ?? undefined}
        payCycle={business.payCycle ?? undefined}
        payDayOfWeek={business.payDayOfWeek ?? undefined}
        payDayOfMonth={business.payDayOfMonth ?? undefined}
        userName={session.user.name ?? "Employer"}
      />
    </main>
  );
}
