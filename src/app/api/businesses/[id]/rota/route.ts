import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

export const dynamic = "force-dynamic";

async function getAccess(
  businessId: string,
  userId: string
): Promise<{ business: { id: string }; isOwner: boolean } | null> {
  const business = await prisma.business.findFirst({
    where: { id: businessId },
  });
  if (!business) return null;
  if (business.employerId === userId) {
    return { business, isOwner: true };
  }
  const link = await prisma.businessEmployee.findUnique({
    where: {
      businessId_employeeId: { businessId, employeeId: userId },
    },
  });
  if (!link) return null;
  return { business, isOwner: false };
}

function shiftToJson(shift: {
  id: string;
  businessId: string;
  employeeId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  employee?: { id: string; name: string; email: string } | null;
}) {
  return {
    id: shift.id,
    businessId: shift.businessId,
    employeeId: shift.employeeId,
    employeeName: shift.employee?.name,
    employeeEmail: shift.employee?.email,
    dayOfWeek: shift.dayOfWeek,
    startTime: shift.startTime,
    endTime: shift.endTime,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId } = await params;
    const access = await getAccess(businessId, token.sub);
    if (!access) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const shifts = await prisma.rotaShift.findMany({
      where: { businessId },
      include: { employee: { select: { id: true, name: true, email: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(shifts.map(shiftToJson));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch rota" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId } = await params;
    const access = await getAccess(businessId, token.sub);
    if (!access || !access.isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, dayOfWeek, startTime, endTime } = body;

    if (
      employeeId == null ||
      dayOfWeek == null ||
      typeof startTime !== "string" ||
      typeof endTime !== "string"
    ) {
      return NextResponse.json(
        { error: "employeeId, dayOfWeek, startTime and endTime are required" },
        { status: 400 }
      );
    }

    const day = Number(dayOfWeek);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return NextResponse.json(
        { error: "dayOfWeek must be 0 (Sunday) to 6 (Saturday)" },
        { status: 400 }
      );
    }

    const link = await prisma.businessEmployee.findUnique({
      where: {
        businessId_employeeId: { businessId, employeeId },
      },
      include: { employee: true },
    });
    if (!link) {
      return NextResponse.json(
        { error: "Employee not found in this business" },
        { status: 404 }
      );
    }

    const shift = await prisma.rotaShift.create({
      data: {
        businessId,
        employeeId,
        dayOfWeek: day,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
      },
      include: { employee: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(shiftToJson(shift));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add rota shift" },
      { status: 500 }
    );
  }
}
