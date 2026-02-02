import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendCustomEmail } from "@/lib/email";

const secret = process.env.NEXTAUTH_SECRET;

async function getBusinessAndCheck(businessId: string, employerId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, employerId },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer = (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId, employeeId } = await params;
    const business = await getBusinessAndCheck(businessId, token.sub);
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
    const { subject, body: emailBody } = body;
    if (!emailBody?.trim()) {
      return NextResponse.json(
        { error: "Email body is required" },
        { status: 400 }
      );
    }
    let emailSent = false;
    let emailError: string | undefined;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendCustomEmail({
          to: link.employee.email,
          subject: (subject as string)?.trim() ?? "Message from your employer",
          body: String(emailBody).trim(),
        });
        emailSent = true;
      } catch (err) {
        emailError = err instanceof Error ? err.message : "Email send failed";
        console.error("Custom email error:", err);
      }
    } else {
      emailError =
        "SMTP not configured. Add SMTP_USER and SMTP_PASS to .env.";
    }
    return NextResponse.json({
      success: true,
      emailSent,
      emailError: emailError ?? undefined,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
