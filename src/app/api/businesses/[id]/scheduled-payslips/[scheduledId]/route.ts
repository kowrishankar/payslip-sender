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

async function getScheduledIfOwner(businessId: string, scheduledId: string, userId: string) {
  const business = await getBusinessIfOwner(businessId, userId);
  if (!business) return null;
  const sp = await prisma.scheduledPayslip.findFirst({
    where: { id: scheduledId, businessId, status: "pending" },
    include: { employee: true },
  });
  return sp;
}

export async function PATCH(
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
    const body = await req.json();
    const { scheduledAt, emailMessage } = body;
    const data: { scheduledAt?: Date; emailMessage?: string | null } = {};
    if (scheduledAt !== undefined) {
      const d = new Date(scheduledAt as string);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid scheduled date/time" }, { status: 400 });
      }
      if (d <= new Date()) {
        return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
      }
      data.scheduledAt = d;
    }
    if (emailMessage !== undefined) data.emailMessage = (emailMessage as string)?.trim() || null;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({
        id: sp.id,
        fileName: sp.fileName,
        scheduledAt: sp.scheduledAt.toISOString(),
        employeeName: sp.employee.name,
        employeeEmail: sp.employee.email,
      });
    }
    const updated = await prisma.scheduledPayslip.update({
      where: { id: scheduledId },
      data,
    });
    return NextResponse.json({
      id: updated.id,
      fileName: updated.fileName,
      scheduledAt: updated.scheduledAt.toISOString(),
      emailMessage: updated.emailMessage ?? undefined,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update scheduled payslip" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await prisma.scheduledPayslip.delete({
      where: { id: scheduledId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to cancel scheduled payslip" },
      { status: 500 }
    );
  }
}
