import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

export const dynamic = "force-dynamic";

async function getBusinessIfOwner(businessId: string, userId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, employerId: userId },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer =
      (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const businessId = params.id;
    const business = await getBusinessIfOwner(businessId, token.sub);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    const now = new Date();
    const list = await prisma.scheduledPayslip.findMany({
      where: { businessId, status: "pending", scheduledAt: { gt: now } },
      include: { employee: { select: { id: true, name: true, email: true } } },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(
      list.map((sp) => ({
        id: sp.id,
        fileName: sp.fileName,
        emailMessage: sp.emailMessage ?? undefined,
        amountCents: sp.amountCents ?? undefined,
        scheduledAt: sp.scheduledAt.toISOString(),
        employeeId: sp.employeeId,
        employeeName: sp.employee.name,
        employeeEmail: sp.employee.email,
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled payslips" },
      { status: 500 }
    );
  }
}
