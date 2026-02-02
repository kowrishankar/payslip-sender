import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

const secret = process.env.NEXTAUTH_SECRET;
const LOGOS_DIR = path.join(process.cwd(), "uploads", "business-logos");
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function ensureLogosDir() {
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }
}

async function getBusinessIfOwner(businessId: string, userId: string) {
  return prisma.business.findFirst({
    where: { id: businessId, employerId: userId },
  });
}

export const dynamic = "force-dynamic";

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
    const row = business as typeof business & { logoPath?: string | null; logoUrl?: string | null };
    const logoPath = row?.logoPath ?? null;
    const logoUrl = row?.logoUrl ?? null;

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Blob URL or external URL stored in logoPath / logoUrl
    const url = logoPath?.startsWith("http") ? logoPath : logoUrl;
    if (url) {
      const res = await fetch(url);
      if (!res.ok) {
        return NextResponse.json({ error: "Logo not found" }, { status: 404 });
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? "image/png";
      return new NextResponse(buffer, {
        headers: { "Content-Type": contentType },
      });
    }

    // Local file path
    if (logoPath) {
      const absolutePath = path.join(process.cwd(), logoPath);
      if (!fs.existsSync(absolutePath)) {
        return NextResponse.json({ error: "Logo not found" }, { status: 404 });
      }
      const buffer = fs.readFileSync(absolutePath);
      const ext = path.extname(logoPath).toLowerCase();
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
    }

    return NextResponse.json({ error: "No logo" }, { status: 404 });
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
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (useBlob) {
      const blob = await put(`business-logos/${businessId}${ext}`, buffer, {
        access: "public",
        contentType: file.type || undefined,
      });
      await prisma.business.update({
        where: { id: businessId },
        data: { logoPath: blob.url } as Parameters<typeof prisma.business.update>[0]["data"],
      });
      return NextResponse.json({
        success: true,
        logoPath: blob.url,
      });
    }

    ensureLogosDir();
    const relativePath = path.join("uploads", "business-logos", `${businessId}${ext}`);
    const absolutePath = path.join(process.cwd(), relativePath);
    fs.writeFileSync(absolutePath, buffer);
    await prisma.business.update({
      where: { id: businessId },
      data: { logoPath: relativePath } as Parameters<typeof prisma.business.update>[0]["data"],
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
