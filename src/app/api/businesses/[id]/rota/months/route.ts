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
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "12", 10), 1), 48);
    const cursor = searchParams.get("cursor"); // "YYYY-MM" for next page

    const raw = await prisma.rotaShift.findMany({
      where: { businessId },
      select: { weekStartDate: true },
      orderBy: { weekStartDate: "desc" },
    });

    const monthSet = new Set<string>();
    for (const row of raw) {
      const d = row.weekStartDate;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      monthSet.add(`${y}-${m}`);
    }

    let months = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

    const cursorIndex = cursor ? months.indexOf(cursor) : -1;
    const start = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    const slice = months.slice(start, start + limit);
    const hasMore = start + slice.length < months.length;
    const nextCursor = hasMore && slice.length > 0 ? slice[slice.length - 1] : null;

    const withLabels = slice.map((ym) => {
      const [y, m] = ym.split("-").map(Number);
      const date = new Date(y, m - 1, 1);
      const label = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      return { year: y, month: m, key: ym, label };
    });

    return NextResponse.json({
      months: withLabels,
      nextCursor,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch rota months" },
      { status: 500 }
    );
  }
}
