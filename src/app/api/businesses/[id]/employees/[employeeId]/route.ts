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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer =
      (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const businessId = params.id;
    const employeeId = params.employeeId;
    const business = await getBusinessIfOwner(businessId, token.sub);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    const link = await prisma.businessEmployee.findUnique({
      where: {
        businessId_employeeId: { businessId, employeeId },
      },
      include: { employee: true },
    });
    if (!link) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    const body = await req.json();
    const { name, department, startDate, address, contactNumber, payCycle, payDayOfWeek, payDayOfMonth } = body;
    const data: {
      name?: string;
      department?: string | null;
      startDate?: Date | null;
      address?: string | null;
      contactNumber?: string | null;
    } = {};
    if (name !== undefined) data.name = String(name).trim() || link.employee.name;
    if (department !== undefined) data.department = department?.trim() || null;
    if (startDate !== undefined) {
      if (startDate === null || startDate === "") {
        data.startDate = null;
      } else {
        const d = new Date(startDate as string);
        if (!isNaN(d.getTime())) data.startDate = d;
      }
    }
    if (address !== undefined) data.address = address?.trim() || null;
    if (contactNumber !== undefined) data.contactNumber = contactNumber?.trim() || null;
    await prisma.user.update({
      where: { id: employeeId },
      data,
    });
    const linkData: {
      payCycle?: string | null;
      payDayOfWeek?: number | null;
      payDayOfMonth?: number | null;
    } = {};
    const cycle =
      payCycle === "weekly" || payCycle === "monthly" ? payCycle : payCycle === "" || payCycle === null ? null : undefined;
    if (payCycle !== undefined) {
      linkData.payCycle = cycle ?? null;
      if (cycle === "weekly") {
        linkData.payDayOfMonth = null;
        const w = payDayOfWeek !== undefined && payDayOfWeek !== "" ? Number(payDayOfWeek) : undefined;
        if (w !== undefined && !Number.isNaN(w) && w >= 0 && w <= 6) linkData.payDayOfWeek = w;
      } else if (cycle === "monthly") {
        linkData.payDayOfWeek = null;
        const m = payDayOfMonth !== undefined && payDayOfMonth !== "" ? Number(payDayOfMonth) : undefined;
        if (m !== undefined && !Number.isNaN(m) && m >= 1 && m <= 31) linkData.payDayOfMonth = m;
      } else {
        linkData.payDayOfWeek = null;
        linkData.payDayOfMonth = null;
      }
    }
    if (Object.keys(linkData).length > 0) {
      await prisma.businessEmployee.update({
        where: { businessId_employeeId: { businessId, employeeId } },
        data: linkData as Parameters<typeof prisma.businessEmployee.update>[0]["data"],
      });
    }
    const updated = await prisma.user.findUnique({
      where: { id: employeeId },
    });
    const updatedLink = await prisma.businessEmployee.findUnique({
      where: { businessId_employeeId: { businessId, employeeId } },
    });
    const linkRow = updatedLink as typeof updatedLink & { payCycle?: string | null; payDayOfWeek?: number | null; payDayOfMonth?: number | null };
    if (!updated) return NextResponse.json({ success: true });
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      department: updated.department ?? undefined,
      startDate: updated.startDate?.toISOString().slice(0, 10),
      address: updated.address ?? undefined,
      contactNumber: updated.contactNumber ?? undefined,
      createdAt: updated.createdAt.toISOString(),
      payCycle: linkRow?.payCycle ?? undefined,
      payDayOfWeek: linkRow?.payDayOfWeek ?? undefined,
      payDayOfMonth: linkRow?.payDayOfMonth ?? undefined,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; employeeId: string } }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer =
      (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const businessId = params.id;
    const employeeId = params.employeeId;
    const business = await getBusinessIfOwner(businessId, token.sub);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    await prisma.businessEmployee.delete({
      where: {
        businessId_employeeId: { businessId, employeeId },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
