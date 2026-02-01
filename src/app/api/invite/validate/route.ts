import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }
    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteTokenExpires: { gt: new Date() },
        role: "employee",
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
    }
    return NextResponse.json({ name: user.name, email: user.email });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to validate" }, { status: 500 });
  }
}
