import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

async function getBusinessAndCheck(businessId: string, employerId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, employerId },
  });
}

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer = (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const businessId = params.id;
    const business = await getBusinessAndCheck(businessId, token.sub);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || undefined;
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to"); // YYYY-MM-DD
    const where: {
      businessId: string;
      employeeId?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = { businessId };
    if (employeeId) where.employeeId = employeeId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from + "T00:00:00.000Z");
      if (to) where.createdAt.lte = new Date(to + "T23:59:59.999Z");
    }
    const payslips = await prisma.payslip.findMany({
      where,
      include: { employee: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      payslips.map((p) => ({
        id: p.id,
        fileName: p.fileName,
        employeeId: p.employeeId,
        employeeName: p.employee.name,
        employeeEmail: p.employee.email,
        emailMessage: p.emailMessage ?? undefined,
        amountCents: p.amountCents ?? undefined,
        createdAt: p.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    );
  }
}
