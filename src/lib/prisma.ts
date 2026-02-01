import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** Find project root (directory containing prisma/schema.prisma or package.json). */
function getProjectRoot(): string {
  const candidates = [process.cwd(), typeof __dirname !== "undefined" ? __dirname : process.cwd()];
  for (const dir of candidates) {
    let current = path.resolve(dir);
    for (let i = 0; i < 10; i++) {
      if (fs.existsSync(path.join(current, "prisma", "schema.prisma"))) return current;
      if (fs.existsSync(path.join(current, "package.json"))) return current;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return process.cwd();
}

// Resolve relative SQLite paths to absolute and ensure the DB directory exists
function resolveDatabaseUrl(url: string | undefined): string | undefined {
  if (!url || !url.startsWith("file:")) return url;
  let relativePath = url.replace(/^file:\/?/, "").replace(/^\.\//, "");
  if (path.isAbsolute(relativePath)) {
    ensureDir(path.dirname(relativePath));
    return url;
  }
  const root = getProjectRoot();
  const absolutePath = path.join(root, relativePath);
  ensureDir(path.dirname(absolutePath));
  return "file:" + absolutePath;
}

function ensureDir(dir: string) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // ignore
  }
}

const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
