import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

export const dynamic = "force-dynamic";

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date.toISOString().slice(0, 10);
}

function getEditableWeekStarts(): string[] {
  const today = new Date();
  const thisMonday = getMonday(today);
  const d = new Date(thisMonday);
  return [
    thisMonday,
    addDays(d, 7),
    addDays(d, 14),
  ];
}

function addDays(d: Date, days: number): string {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function isEditableWeek(weekStartDate: string): boolean {
  const editable = getEditableWeekStarts();
  return editable.includes(weekStartDate);
}

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
  weekStartDate: Date;
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
    weekStartDate: shift.weekStartDate.toISOString().slice(0, 10),
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

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const monthParam = searchParams.get("month");

    let fromDate: string;
    let toDate: string;

    if (monthParam) {
      const [y, m] = monthParam.split("-").map(Number);
      if (!y || !m) {
        return NextResponse.json(
          { error: "Invalid month (use YYYY-MM)" },
          { status: 400 }
        );
      }
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      fromDate = getMonday(first);
      toDate = getMonday(last);
    } else if (fromParam && toParam) {
      fromDate = fromParam;
      toDate = toParam;
    } else {
      const today = new Date();
      const thisMonday = getMonday(today);
      const thisMondayDate = new Date(thisMonday);
      const prevMonday = addDays(new Date(thisMondayDate.getTime()), -7);
      const twoWeeksLater = addDays(thisMondayDate, 14);
      fromDate = prevMonday;
      toDate = twoWeeksLater;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    const shifts = await prisma.rotaShift.findMany({
      where: {
        businessId,
        weekStartDate: { gte: from, lte: to },
      },
      include: { employee: { select: { id: true, name: true, email: true } } },
      orderBy: [{ weekStartDate: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
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
    const { employeeId, weekStartDate, dayOfWeek, startTime, endTime } = body;

    if (
      employeeId == null ||
      weekStartDate == null ||
      dayOfWeek == null ||
      typeof startTime !== "string" ||
      typeof endTime !== "string"
    ) {
      return NextResponse.json(
        { error: "employeeId, weekStartDate, dayOfWeek, startTime and endTime are required" },
        { status: 400 }
      );
    }

    const weekStart = String(weekStartDate).slice(0, 10);
    if (!isEditableWeek(weekStart)) {
      return NextResponse.json(
        { error: "You can only add shifts for the current week or the next two weeks" },
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
        weekStartDate: new Date(weekStart),
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
