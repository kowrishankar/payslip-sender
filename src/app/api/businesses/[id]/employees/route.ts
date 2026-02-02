import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail, sendAddedAsEmployeeEmail } from "@/lib/email";
import crypto from "crypto";

const secret = process.env.NEXTAUTH_SECRET;
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

async function getBusinessIfOwner(businessId: string, userId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, employerId: userId },
  });
}

function daysUntilPaymentDue(
  payCycle: string | null | undefined,
  payDayOfWeek: number | null | undefined,
  payDayOfMonth: number | null | undefined,
  businessFallback: { payCycle: string | null; payDayOfWeek: number | null; payDayOfMonth: number | null }
): number | null {
  const cycle = payCycle ?? businessFallback.payCycle;
  if (!cycle || (cycle !== "weekly" && cycle !== "monthly")) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (cycle === "weekly") {
    const day = payDayOfWeek ?? businessFallback.payDayOfWeek;
    if (day == null || day < 0 || day > 6) return null;
    const currentDay = today.getDay();
    let days = (day - currentDay + 7) % 7;
    if (days === 0) days = 7;
    return days;
  }

  if (cycle === "monthly") {
    const dayOfMonth = payDayOfMonth ?? businessFallback.payDayOfMonth;
    if (dayOfMonth == null || dayOfMonth < 1 || dayOfMonth > 31) return null;
    const currentDate = today.getDate();
    const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const payDayThisMonth = Math.min(dayOfMonth, lastDayThisMonth);
    if (currentDate < payDayThisMonth) return payDayThisMonth - currentDate;
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1);
    const lastDayNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    const payDayNextMonth = Math.min(dayOfMonth, lastDayNextMonth);
    const nextPayDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), payDayNextMonth);
    return Math.ceil((nextPayDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  return null;
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
    const links = await prisma.businessEmployee.findMany({
      where: { businessId },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });
    const fallback = {
      payCycle: business.payCycle,
      payDayOfWeek: business.payDayOfWeek,
      payDayOfMonth: business.payDayOfMonth,
    };

    type LinkWithPay = typeof links[0] & { payCycle?: string | null; payDayOfWeek?: number | null; payDayOfMonth?: number | null };
    const list = links.map((link) => {
      const l = link as LinkWithPay;
      const employee = link.employee;
      const daysDue = daysUntilPaymentDue(
        l.payCycle,
        l.payDayOfWeek,
        l.payDayOfMonth,
        fallback
      );
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department ?? undefined,
        startDate: employee.startDate?.toISOString().slice(0, 10),
        address: employee.address ?? undefined,
        contactNumber: employee.contactNumber ?? undefined,
        createdAt: employee.createdAt.toISOString(),
        hasAcceptedInvite: !!employee.passwordHash,
        payCycle: l.payCycle ?? undefined,
        payDayOfWeek: l.payDayOfWeek ?? undefined,
        payDayOfMonth: l.payDayOfMonth ?? undefined,
        daysUntilPaymentDue: daysDue,
      };
    });
    return NextResponse.json(list);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const body = await req.json();
    const {
      name,
      email,
      department,
      startDate,
      address,
      contactNumber,
      payCycle,
      payDayOfWeek,
      payDayOfMonth,
    } = body;
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    const normalizedEmail = email.trim().toLowerCase();
    let employeeUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (employeeUser) {
      const existing = await prisma.businessEmployee.findUnique({
        where: {
          businessId_employeeId: { businessId, employeeId: employeeUser.id },
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "This employee is already in this business" },
          { status: 409 }
        );
      }
      const w = payDayOfWeek !== undefined && payDayOfWeek !== "" ? Number(payDayOfWeek) : NaN;
      const m = payDayOfMonth !== undefined && payDayOfMonth !== "" ? Number(payDayOfMonth) : NaN;
      await prisma.businessEmployee.create({
        data: {
          businessId,
          employeeId: employeeUser.id,
          payCycle: payCycle === "weekly" || payCycle === "monthly" ? payCycle : null,
          payDayOfWeek: payCycle === "weekly" && !Number.isNaN(w) && w >= 0 && w <= 6 ? w : null,
          payDayOfMonth: payCycle === "monthly" && !Number.isNaN(m) && m >= 1 && m <= 31 ? m : null,
        } as Parameters<typeof prisma.businessEmployee.create>[0]["data"],
      });
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const loginLink = `${baseUrl}/login?callbackUrl=${encodeURIComponent(`${baseUrl}/my-payslips`)}`;
        if (employeeUser.passwordHash) {
          await sendAddedAsEmployeeEmail({
            to: normalizedEmail,
            employeeName: name.trim(),
            businessName: business.name,
            loginLink,
          });
        } else {
          const inviteToken = crypto.randomBytes(32).toString("hex");
          const inviteTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await prisma.user.update({
            where: { id: employeeUser.id },
            data: { inviteToken, inviteTokenExpires },
          });
          const inviteLink = `${baseUrl}/invite/accept?token=${inviteToken}`;
          await sendInviteEmail({
            to: normalizedEmail,
            employeeName: name.trim(),
            inviteLink,
          });
        }
      }
      const link = await prisma.businessEmployee.findUnique({
        where: { businessId_employeeId: { businessId, employeeId: employeeUser.id } },
        include: { business: true },
      });
      const linkPay = link as typeof link & { payCycle?: string | null; payDayOfWeek?: number | null; payDayOfMonth?: number | null };
      const fallback = link?.business
        ? {
            payCycle: link.business.payCycle,
            payDayOfWeek: link.business.payDayOfWeek,
            payDayOfMonth: link.business.payDayOfMonth,
          }
        : { payCycle: null as string | null, payDayOfWeek: null as number | null, payDayOfMonth: null as number | null };
      const daysDue = link
        ? daysUntilPaymentDue(linkPay.payCycle, linkPay.payDayOfWeek, linkPay.payDayOfMonth, fallback)
        : null;
      return NextResponse.json({
        id: employeeUser.id,
        name: employeeUser.name,
        email: employeeUser.email,
        department: employeeUser.department ?? undefined,
        startDate: employeeUser.startDate?.toISOString().slice(0, 10),
        address: employeeUser.address ?? undefined,
        contactNumber: employeeUser.contactNumber ?? undefined,
        createdAt: employeeUser.createdAt.toISOString(),
        hasAcceptedInvite: !!employeeUser.passwordHash,
        payCycle: linkPay.payCycle ?? undefined,
        payDayOfWeek: linkPay.payDayOfWeek ?? undefined,
        payDayOfMonth: linkPay.payDayOfMonth ?? undefined,
        daysUntilPaymentDue: daysDue ?? undefined,
      });
    }
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const parsedStartDate = startDate?.trim() ? new Date(startDate as string) : null;
    if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid start date" },
        { status: 400 }
      );
    }
    employeeUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        role: "employee",
        department: department?.trim() || null,
        startDate: parsedStartDate,
        address: address?.trim() || null,
        contactNumber: contactNumber?.trim() || null,
        inviteToken,
        inviteTokenExpires,
      },
    });
    const w = payDayOfWeek !== undefined && payDayOfWeek !== "" ? Number(payDayOfWeek) : NaN;
    const m = payDayOfMonth !== undefined && payDayOfMonth !== "" ? Number(payDayOfMonth) : NaN;
    await prisma.businessEmployee.create({
      data: {
        businessId,
        employeeId: employeeUser.id,
        payCycle: payCycle === "weekly" || payCycle === "monthly" ? payCycle : null,
        payDayOfWeek: payCycle === "weekly" && !Number.isNaN(w) && w >= 0 && w <= 6 ? w : null,
        payDayOfMonth: payCycle === "monthly" && !Number.isNaN(m) && m >= 1 && m <= 31 ? m : null,
      } as Parameters<typeof prisma.businessEmployee.create>[0]["data"],
    });
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const inviteLink = `${baseUrl}/invite/accept?token=${inviteToken}`;
      await sendInviteEmail({
        to: normalizedEmail,
        employeeName: name.trim(),
        inviteLink,
      });
    }
    const link = await prisma.businessEmployee.findUnique({
      where: { businessId_employeeId: { businessId, employeeId: employeeUser.id } },
      include: { business: true },
    });
    const linkPay2 = link as typeof link & { payCycle?: string | null; payDayOfWeek?: number | null; payDayOfMonth?: number | null };
    const fallback = link?.business
      ? {
          payCycle: link.business.payCycle,
          payDayOfWeek: link.business.payDayOfWeek,
          payDayOfMonth: link.business.payDayOfMonth,
        }
      : { payCycle: null as string | null, payDayOfWeek: null as number | null, payDayOfMonth: null as number | null };
    const daysDue = link
      ? daysUntilPaymentDue(linkPay2.payCycle, linkPay2.payDayOfWeek, linkPay2.payDayOfMonth, fallback)
      : null;
    return NextResponse.json({
      id: employeeUser.id,
      name: employeeUser.name,
      email: employeeUser.email,
      department: employeeUser.department ?? undefined,
      startDate: employeeUser.startDate?.toISOString().slice(0, 10),
      address: employeeUser.address ?? undefined,
      contactNumber: employeeUser.contactNumber ?? undefined,
      createdAt: employeeUser.createdAt.toISOString(),
      hasAcceptedInvite: false,
      payCycle: linkPay2.payCycle ?? undefined,
      payDayOfWeek: linkPay2.payDayOfWeek ?? undefined,
      payDayOfMonth: linkPay2.payDayOfMonth ?? undefined,
      daysUntilPaymentDue: daysDue ?? undefined,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add employee" },
      { status: 500 }
    );
  }
}
