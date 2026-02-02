import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

const secret = process.env.NEXTAUTH_SECRET;
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "payslips");
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (token.role === "employer") {
      const { searchParams } = new URL(req.url);
      const businessId = searchParams.get("businessId") || undefined;
      const employeeId = searchParams.get("employeeId") || undefined;
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      const where: {
        employerId: string;
        businessId?: string | null;
        employeeId?: string;
        createdAt?: { gte?: Date; lte?: Date };
      } = { employerId: token.sub };
      if (businessId) where.businessId = businessId;
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
          businessId: p.businessId ?? undefined,
          employeeId: p.employeeId,
          employeeName: p.employee.name,
          employeeEmail: p.employee.email,
          emailMessage: p.emailMessage ?? undefined,
          amountCents: (p as { amountCents?: number | null }).amountCents ?? undefined,
          createdAt: p.createdAt.toISOString(),
        }))
      );
    }

    if (token.role === "employee") {
      const payslips = await prisma.payslip.findMany({
        where: { employeeId: token.sub },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(
        payslips.map((p) => ({
          id: p.id,
          fileName: p.fileName,
          createdAt: p.createdAt.toISOString(),
        }))
      );
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch payslips" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub || token.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const businessId = formData.get("businessId") as string | null;
    const employeeId = formData.get("employeeId") as string | null;
    const file = formData.get("payslip") as File | null;
    const emailMessage = (formData.get("message") as string | null)?.trim() || null;
    const amountStr = formData.get("amount") as string | null;
    const amountCents = amountStr ? Math.round(parseFloat(amountStr) * 100) : null;

    if (!businessId || !employeeId || !file) {
      return NextResponse.json(
        { error: "businessId, employeeId and payslip file are required" },
        { status: 400 }
      );
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, employerId: token.sub },
    });
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
      return NextResponse.json({ error: "Employee not found in this business" }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name || "payslip.pdf";
    const ext = path.extname(fileName) || ".pdf";
    const payslipId = crypto.randomUUID();
    let filePath: string;

    if (useBlob) {
      const blob = await put(`payslips/${payslipId}${ext}`, buffer, {
        access: "public",
        contentType: file.type || "application/pdf",
      });
      filePath = blob.url;
    } else {
      ensureUploadsDir();
      const absolutePath = path.join(UPLOADS_DIR, `${payslipId}${ext}`);
      fs.writeFileSync(absolutePath, buffer);
      filePath = path.relative(process.cwd(), absolutePath);
    }

    await prisma.payslip.create({
      data: {
        id: payslipId,
        fileName,
        filePath,
        emailMessage,
        businessId,
        employerId: token.sub,
        employeeId,
        ...(amountCents != null && { amountCents }),
      },
    });

    let emailSent = false;
    let emailError: string | undefined;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const { sendPayslipAvailableEmail } = await import("@/lib/email");
        const portalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/my-payslips`;
        await sendPayslipAvailableEmail({
          to: link.employee.email,
          employeeName: link.employee.name,
          portalLink,
          message: emailMessage ?? undefined,
        });
        emailSent = true;
      } catch (err) {
        emailError = err instanceof Error ? err.message : "Email send failed";
        console.error("Payslip email error:", err);
      }
    } else {
      emailError =
        "SMTP not configured. Add SMTP_USER and SMTP_PASS to .env to send notification emails.";
    }

    return NextResponse.json({
      success: true,
      id: payslipId,
      message: "Payslip uploaded and employee notified",
      emailSent,
      emailError: emailError ?? undefined,
    });
  } catch (error) {
    console.error("Upload payslip error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload payslip",
      },
      { status: 500 }
    );
  }
}
