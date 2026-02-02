import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

async function getBusinessAndCheck(
  businessId: string,
  employerId: string
) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, employerId },
  });
  return business;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer = (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId } = await params;
    const business = await getBusinessAndCheck(businessId, token.sub);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: business.id,
      name: business.name,
      address: business.address ?? undefined,
      logoUrl: business.logoUrl ?? undefined,
      logoPath: business.logoPath ?? undefined,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer = (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId } = await params;
    const business = await getBusinessAndCheck(businessId, token.sub);
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    const isEmployer = (token as { isEmployer?: boolean }).isEmployer ?? token?.role === "employer";
    if (!token?.sub || !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId } = await params;
    const business = await getBusinessAndCheck(businessId, token.sub);
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
    if (address !== undefined) data.address = (address as string)?.trim() || null;
    if (logoUrl !== undefined) data.logoUrl = (logoUrl as string)?.trim() || null;
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
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      address: updated.address ?? undefined,
      logoUrl: updated.logoUrl ?? undefined,
      logoPath: updated.logoPath ?? undefined,
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
