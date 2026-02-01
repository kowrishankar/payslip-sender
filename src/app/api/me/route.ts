import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: token.sub },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const profile: {
      id: string;
      email: string;
      name: string;
      role: string;
      department?: string;
      startDate?: string;
      address?: string;
      contactNumber?: string;
    } = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department ?? undefined,
      startDate: user.startDate?.toISOString().slice(0, 10),
      address: user.address ?? undefined,
      contactNumber: user.contactNumber ?? undefined,
    };
    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
