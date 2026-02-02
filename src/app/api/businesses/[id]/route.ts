import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

export const dynamic = "force-dynamic";

async function getBusinessIfOwner(businessId: string, userId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, employerId: userId },
  });
  return business;
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
    const row = business as typeof business & { address?: string | null; logoUrl?: string | null; logoPath?: string | null };
    return NextResponse.json({
      id: business.id,
      name: business.name,
      address: row.address ?? undefined,
      logoUrl: row.logoUrl ?? undefined,
      logoPath: row.logoPath ?? undefined,
      payCycle: business.payCycle ?? undefined,
      payDayOfWeek: business.payDayOfWeek ?? undefined,
      payDayOfMonth: business.payDayOfMonth ?? undefined,
      createdAt: business.createdAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name, address, logoUrl, payCycle, payDayOfWeek, payDayOfMonth } = body;
    const data: {
      name?: string;
      address?: string | null;
      logoUrl?: string | null;
      payCycle?: string | null;
      payDayOfWeek?: number | null;
      payDayOfMonth?: number | null;
    } = {};
    if (name !== undefined) data.name = String(name).trim() || business.name;
    if (address !== undefined) (data as Record<string, unknown>).address = (address as string)?.trim() || null;
    if (logoUrl !== undefined) (data as Record<string, unknown>).logoUrl = (logoUrl as string)?.trim() || null;
    if (payCycle !== undefined) data.payCycle = payCycle === "" ? null : (payCycle as string);
    if (payDayOfWeek !== undefined) {
      const n = parseInt(payDayOfWeek as string, 10);
      data.payDayOfWeek = isNaN(n) ? null : Math.max(0, Math.min(6, n));
    }
    if (payDayOfMonth !== undefined) {
      const n = parseInt(payDayOfMonth as string, 10);
      data.payDayOfMonth = isNaN(n) ? null : Math.max(1, Math.min(31, n));
    }
    const updated = await prisma.business.update({
      where: { id: businessId },
      data,
    });
    const updatedRow = updated as typeof updated & { address?: string | null; logoUrl?: string | null; logoPath?: string | null };
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      address: updatedRow.address ?? undefined,
      logoUrl: updatedRow.logoUrl ?? undefined,
      logoPath: updatedRow.logoPath ?? undefined,
      payCycle: updated.payCycle ?? undefined,
      payDayOfWeek: updated.payDayOfWeek ?? undefined,
      payDayOfMonth: updated.payDayOfMonth ?? undefined,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await prisma.business.delete({
      where: { id: businessId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
