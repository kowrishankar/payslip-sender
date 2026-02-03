import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { sendPayslipAvailableEmail } from "@/lib/email";

const secret = process.env.NEXTAUTH_SECRET;
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "payslips");
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

type BulkItem = {
  file: File;
  employeeId: string;
  message: string | null;
  amountCents: number | null;
};

function parseBulkFormData(formData: FormData): { businessId: string; scheduleFor: Date | null; items: BulkItem[] } {
  const businessId = formData.get("businessId") as string | null;
  if (!businessId) throw new Error("businessId is required");

  const scheduleForStr = (formData.get("scheduleFor") as string | null)?.trim() || null;
  let scheduleFor: Date | null = null;
  if (scheduleForStr) {
    scheduleFor = new Date(scheduleForStr);
    if (Number.isNaN(scheduleFor.getTime())) scheduleFor = null;
  }

  const items: BulkItem[] = [];
  let i = 0;
  while (true) {
    const file = formData.get(`payslip_${i}`) as File | null;
    const employeeId = formData.get(`employeeId_${i}`) as string | null;
    if (!file || !employeeId) break;
    const message = (formData.get(`message_${i}`) as string | null)?.trim() || null;
    const amountStr = formData.get(`amount_${i}`) as string | null;
    const amountCents = amountStr ? Math.round(parseFloat(amountStr) * 100) : null;
    items.push({ file, employeeId, message, amountCents });
    i++;
  }

  return { businessId, scheduleFor, items };
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer = (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    let businessId: string;
    let scheduleFor: Date | null;
    let items: BulkItem[];

    try {
      const parsed = parseBulkFormData(formData);
      businessId = parsed.businessId;
      scheduleFor = parsed.scheduleFor;
      items = parsed.items;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid form data" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Add at least one payslip file and assign an employee" },
        { status: 400 }
      );
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, employerId: token.sub },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const now = new Date();
    const isScheduled = scheduleFor != null && scheduleFor > now;

    if (isScheduled) {
      // Store files and create ScheduledPayslip for each
      const results: { index: number; scheduledPayslipId?: string; error?: string }[] = [];

      for (let i = 0; i < items.length; i++) {
        const { file, employeeId, message, amountCents } = items[i];
        try {
          const link = await prisma.businessEmployee.findUnique({
            where: { businessId_employeeId: { businessId, employeeId } },
            include: { employee: true },
          });
          if (!link) {
            results.push({ index: i, error: `Employee not in business` });
            continue;
          }

          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const fileName = file.name || "payslip.pdf";
          const ext = path.extname(fileName) || ".pdf";
          const scheduledId = crypto.randomUUID();
          let filePath: string;

          if (useBlob) {
            const blob = await put(`payslips/scheduled/${scheduledId}${ext}`, buffer, {
              access: "public",
              contentType: file.type || "application/pdf",
            });
            filePath = blob.url;
          } else {
            ensureUploadsDir();
            const absolutePath = path.join(UPLOADS_DIR, `scheduled_${scheduledId}${ext}`);
            fs.writeFileSync(absolutePath, buffer);
            filePath = path.relative(process.cwd(), absolutePath);
          }

          const scheduledPayslip = (prisma as unknown as {
            scheduledPayslip: {
              create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
            };
          }).scheduledPayslip;
          await scheduledPayslip.create({
            data: {
              id: scheduledId,
              fileName,
              filePath,
              emailMessage: message ?? undefined,
              amountCents: amountCents ?? undefined,
              businessId,
              employerId: token.sub,
              employeeId,
              scheduledAt: scheduleFor!,
              status: "pending",
            },
          });
          results.push({ index: i, scheduledPayslipId: scheduledId });
        } catch (err) {
          results.push({
            index: i,
            error: err instanceof Error ? err.message : "Failed to schedule",
          });
        }
      }

      const failed = results.filter((r) => r.error);
      return NextResponse.json({
        success: failed.length === 0,
        message:
          failed.length === 0
            ? `Scheduled ${results.length} payslip(s) for ${scheduleFor!.toLocaleString()}`
            : `Scheduled ${results.length - failed.length}, ${failed.length} failed`,
        scheduledCount: results.length - failed.length,
        failedCount: failed.length,
        results,
      });
    }

    // Send now: create Payslip and send email for each
    const portalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/my-payslips`;
    const results: { index: number; payslipId?: string; emailSent?: boolean; error?: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const { file, employeeId, message, amountCents } = items[i];
      try {
        const link = await prisma.businessEmployee.findUnique({
          where: { businessId_employeeId: { businessId, employeeId } },
          include: { employee: true },
        });
        if (!link) {
          results.push({ index: i, error: "Employee not in business" });
          continue;
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
            emailMessage: message ?? undefined,
            amountCents: amountCents ?? undefined,
            businessId,
            employerId: token.sub,
            employeeId,
          },
        });

        let emailSent = false;
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          try {
            await sendPayslipAvailableEmail({
              to: link.employee.email,
              employeeName: link.employee.name,
              portalLink,
              message: message ?? undefined,
            });
            emailSent = true;
          } catch {
            // continue
          }
        }
        results.push({ index: i, payslipId, emailSent });
      } catch (err) {
        results.push({
          index: i,
          error: err instanceof Error ? err.message : "Failed to send",
        });
      }
    }

    const failed = results.filter((r) => r.error);
    return NextResponse.json({
      success: failed.length === 0,
      message:
        failed.length === 0
          ? `Sent ${results.length} payslip(s)`
          : `Sent ${results.length - failed.length}, ${failed.length} failed`,
      sentCount: results.length - failed.length,
      failedCount: failed.length,
      results,
    });
  } catch (error) {
    console.error("Bulk payslip error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process bulk payslips",
      },
      { status: 500 }
    );
  }
}
