import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub || token.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const businesses = await prisma.business.findMany({
      where: { employerId: token.sub },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      businesses.map((b) => ({
        id: b.id,
        name: b.name,
        payCycle: b.payCycle ?? undefined,
        payDayOfWeek: b.payDayOfWeek ?? undefined,
        payDayOfMonth: b.payDayOfMonth ?? undefined,
        createdAt: b.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
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
    const body = await req.json();
    const { name } = body;
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }
    const business = await prisma.business.create({
      data: {
        name: name.trim(),
        employerId: token.sub,
      },
    });
    return NextResponse.json({
      id: business.id,
      name: business.name,
      payCycle: business.payCycle ?? undefined,
      payDayOfWeek: business.payDayOfWeek ?? undefined,
      payDayOfMonth: business.payDayOfMonth ?? undefined,
      createdAt: business.createdAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}
