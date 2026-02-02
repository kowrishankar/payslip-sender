import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPayslipAvailableEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const pending = await prisma.scheduledPayslip.findMany({
      where: { status: "pending", scheduledAt: { lte: now } },
      include: { employee: true },
    });

    const portalLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/my-payslips`;
    let processed = 0;
    let failed = 0;

    for (const sp of pending) {
      try {
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

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          try {
            await sendPayslipAvailableEmail({
              to: sp.employee.email,
              employeeName: sp.employee.name,
              portalLink,
              message: sp.emailMessage ?? undefined,
            });
          } catch {
            // payslip created; email failed
          }
        }

        await prisma.scheduledPayslip.update({
          where: { id: sp.id },
          data: { status: "sent", sentAt: new Date() },
        });
        processed++;
      } catch (err) {
        console.error("Process scheduled payslip error:", sp.id, err);
        await prisma.scheduledPayslip.update({
          where: { id: sp.id },
          data: { status: "failed" },
        }).catch(() => {});
        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      failed,
      total: pending.length,
    });
  } catch (error) {
    console.error("Cron process-scheduled-payslips error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}
