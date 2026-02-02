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
    const [businessCount, employeeLinkCount] = await Promise.all([
      prisma.business.count({ where: { employerId: user.id } }),
      prisma.businessEmployee.count({ where: { employeeId: user.id } }),
    ]);
    const isEmployer = user.role === "employer" || businessCount > 0;
    const isEmployee = employeeLinkCount > 0;
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmployer,
      isEmployee,
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
