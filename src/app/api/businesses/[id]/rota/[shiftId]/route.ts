import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; shiftId: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId, shiftId } = await params;

    const business = await prisma.business.findFirst({
      where: { id: businessId, employerId: token.sub },
    });
    if (!business) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.rotaShift.findFirst({
      where: { id: shiftId, businessId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    const body = await req.json();
    const { employeeId, dayOfWeek, startTime, endTime } = body;

    const data: { dayOfWeek?: number; startTime?: string; endTime?: string; employeeId?: string } = {};
    if (employeeId != null) {
      const link = await prisma.businessEmployee.findUnique({
        where: {
          businessId_employeeId: { businessId, employeeId },
        },
      });
      if (!link) {
        return NextResponse.json(
          { error: "Employee not found in this business" },
          { status: 404 }
        );
      }
      data.employeeId = employeeId;
    }
    if (dayOfWeek != null) {
      const day = Number(dayOfWeek);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        return NextResponse.json(
          { error: "dayOfWeek must be 0 (Sunday) to 6 (Saturday)" },
          { status: 400 }
        );
      }
      data.dayOfWeek = day;
    }
    if (typeof startTime === "string") data.startTime = startTime.trim();
    if (typeof endTime === "string") data.endTime = endTime.trim();

    const shift = await prisma.rotaShift.update({
      where: { id: shiftId },
      data,
      include: { employee: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({
      id: shift.id,
      businessId: shift.businessId,
      employeeId: shift.employeeId,
      employeeName: shift.employee?.name,
      employeeEmail: shift.employee?.email,
      dayOfWeek: shift.dayOfWeek,
      startTime: shift.startTime,
      endTime: shift.endTime,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update shift" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; shiftId: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId, shiftId } = await params;

    const business = await prisma.business.findFirst({
      where: { id: businessId, employerId: token.sub },
    });
    if (!business) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.rotaShift.findFirst({
      where: { id: shiftId, businessId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    await prisma.rotaShift.delete({ where: { id: shiftId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete shift" },
      { status: 500 }
    );
  }
}
