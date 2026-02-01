import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const secret = process.env.NEXTAUTH_SECRET;
const LOGOS_DIR = path.join(process.cwd(), "uploads", "business-logos");

function ensureLogosDir() {
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }
}

async function getBusinessAndCheck(businessId: string, employerId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, employerId },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub || token.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId } = await params;
    const business = await getBusinessAndCheck(businessId, token.sub);
    if (!business?.logoPath) {
      return NextResponse.json({ error: "No logo" }, { status: 404 });
    }
    const absolutePath = path.join(process.cwd(), business.logoPath);
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const buffer = fs.readFileSync(absolutePath);
    const ext = path.extname(business.logoPath).toLowerCase();
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".gif"
        ? "image/gif"
        : ext === ".webp"
        ? "image/webp"
        : "application/octet-stream";
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load logo" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret });
    if (!token?.sub || token.role !== "employer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: businessId } = await params;
    const business = await getBusinessAndCheck(businessId, token.sub);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    if (!file || !file.size) {
      return NextResponse.json(
        { error: "Logo file is required" },
        { status: 400 }
      );
    }
    const ext = path.extname(file.name || "").toLowerCase() || ".png";
    const allowed = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    if (!allowed.includes(ext)) {
      return NextResponse.json(
        { error: "Logo must be PNG, JPG, GIF or WebP" },
        { status: 400 }
      );
    }
    ensureLogosDir();
    const relativePath = path.join("uploads", "business-logos", `${businessId}${ext}`);
    const absolutePath = path.join(process.cwd(), relativePath);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(absolutePath, Buffer.from(bytes));
    await prisma.business.update({
      where: { id: businessId },
      data: { logoPath: relativePath },
    });
    return NextResponse.json({
      success: true,
      logoPath: relativePath,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}
