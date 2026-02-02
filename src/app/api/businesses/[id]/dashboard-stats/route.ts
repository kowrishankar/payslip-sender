import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

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
    const business = await prisma.business.findFirst({
      where: { id: businessId, employerId: token.sub },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [payslipsAll, payslipsThisWeek, payslipsThisMonth, employees] = await Promise.all([
      prisma.payslip.findMany({
        where: { businessId },
        select: { id: true, amountCents: true, employeeId: true, createdAt: true },
      }),
      prisma.payslip.findMany({
        where: { businessId, createdAt: { gte: startOfWeek } },
        select: { id: true, amountCents: true },
      }),
      prisma.payslip.findMany({
        where: { businessId, createdAt: { gte: startOfMonth } },
        select: { id: true, amountCents: true },
      }),
      prisma.businessEmployee.findMany({
        where: { businessId },
        include: { employee: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const totalPayments = payslipsAll.length;
    const paymentsThisWeek = payslipsThisWeek.length;
    const paymentsThisMonth = payslipsThisMonth.length;
    const totalAmountCentsThisWeek = payslipsThisWeek.reduce(
      (s, p) => s + (p.amountCents ?? 0),
      0
    );
    const totalAmountCentsThisMonth = payslipsThisMonth.reduce(
      (s, p) => s + (p.amountCents ?? 0),
      0
    );

    const employeePaymentMap = new Map<
      string,
      { count: number; totalCents: number }
    >();
    for (const p of payslipsAll) {
      const cur = employeePaymentMap.get(p.employeeId) ?? {
        count: 0,
        totalCents: 0,
      };
      cur.count += 1;
      cur.totalCents += p.amountCents ?? 0;
      employeePaymentMap.set(p.employeeId, cur);
    }

    const employeesWithPayments = employees.map((be) => {
      const stats = employeePaymentMap.get(be.employeeId) ?? {
        count: 0,
        totalCents: 0,
      };
      return {
        id: be.employee.id,
        name: be.employee.name,
        email: be.employee.email,
        paymentCount: stats.count,
        totalAmountCents: stats.totalCents,
      };
    });

    return NextResponse.json({
      totalPayments,
      paymentsThisWeek,
      paymentsThisMonth,
      totalAmountCentsThisWeek,
      totalAmountCentsThisMonth,
      employeeCount: employees.length,
      employeesWithPayments,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
