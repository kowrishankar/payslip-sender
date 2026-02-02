import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendPayslipAvailableEmail } from "@/lib/email";

const secret = process.env.NEXTAUTH_SECRET;

export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function getBusinessIfOwner(businessId: string, userId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, employerId: userId },
  });
}

async function getScheduledIfOwner(businessId: string, scheduledId: string, userId: string) {
  const business = await getBusinessIfOwner(businessId, userId);
  if (!business) return null;
  const sp = await prisma.scheduledPayslip.findFirst({
    where: { id: scheduledId, businessId, status: "pending" },
    include: { employee: true },
  });
  return sp;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; scheduledId: string } }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer =
      (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const businessId = params.id;
    const scheduledId = params.scheduledId;
    const sp = await getScheduledIfOwner(businessId, scheduledId, token.sub);
    if (!sp) {
      return NextResponse.json({ error: "Scheduled payslip not found" }, { status: 404 });
    }

    await prisma.payslip.create({
      data: {
        id: crypto.randomUUID(),
        fileName: sp.fileName,
        filePath: sp.filePath,
        emailMessage: sp.emailMessage ?? undefined,
        amountCents: sp.amountCents ?? undefined,
        businessId: sp.businessId,
        employerId: sp.employerId,
        employeeId: sp.employeeId,
      },
    });

    const portalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/my-payslips`;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendPayslipAvailableEmail({
          to: sp.employee.email,
          employeeName: sp.employee.name,
          portalLink,
          message: sp.emailMessage ?? undefined,
        });
      } catch {
        // payslip created; email may have failed
      }
    }

    await prisma.scheduledPayslip.update({
      where: { id: scheduledId },
      data: { status: "sent", sentAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Payslip sent to ${sp.employee.name}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send payslip" },
      { status: 500 }
    );
  }
}
